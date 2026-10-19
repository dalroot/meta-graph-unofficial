/**
 * API Key Manager & SQLite Persistent Security Vault
 * 
 * Powered by native node:sqlite. Zero external dependencies.
 * Stores non-reversible SHA-256 key hashes and enforces tiered quotas.
 */

import { DatabaseSync } from 'node:sqlite';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type KeyRole = 'master' | 'pro' | 'free';

export interface ApiKeyRecord {
  key_id: string;
  key_prefix: string;
  owner_name: string;
  role: KeyRole;
  daily_limit: number;
  usage_today: number;
  total_usage: number;
  last_reset_date: string;
  is_active: number;
  created_at: string;
}

export interface KeyValidationResult {
  valid: boolean;
  role?: KeyRole;
  owner?: string;
  error?: 'missing_key' | 'invalid_key' | 'revoked_key' | 'daily_limit_exceeded';
  remainingToday?: number;
}

export class ApiKeyManager {
  private db: DatabaseSync;
  private dbPath: string;

  constructor(customDbPath?: string) {
    this.dbPath = customDbPath || path.resolve(process.cwd(), 'data/twin_keys.db');

    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        key_id TEXT PRIMARY KEY,
        key_prefix TEXT NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        owner_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('master', 'pro', 'free')),
        daily_limit INTEGER NOT NULL DEFAULT 100,
        usage_today INTEGER NOT NULL DEFAULT 0,
        total_usage INTEGER NOT NULL DEFAULT 0,
        last_reset_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    `);
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Generates a new API key with cryptographically strong entropy
   * Returns the raw full key (only visible once upon creation)
   */
  public createKey(
    ownerName: string,
    role: KeyRole = 'free',
    options?: { dailyLimit?: number }
  ): { keyId: string; rawKey: string; role: KeyRole; dailyLimit: number } {
    const randomHex = crypto.randomBytes(24).toString('hex');
    const prefix = role === 'master' ? 'tg_live_master_' : role === 'pro' ? 'tg_live_pro_' : 'tg_free_';
    const rawKey = `${prefix}${randomHex}`;
    const keyHash = this.hashToken(rawKey);
    const keyId = `key_${crypto.randomBytes(8).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 18) + '...';

    // Daily limits: master = -1 (unlimited), pro = 10,000, free = 100
    const defaultLimit = role === 'master' ? -1 : role === 'pro' ? 10000 : 100;
    const dailyLimit = options?.dailyLimit !== undefined ? options.dailyLimit : defaultLimit;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO api_keys (
        key_id, key_prefix, key_hash, owner_name, role, daily_limit,
        usage_today, total_usage, last_reset_date, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 1, ?)
    `);

    stmt.run(keyId, keyPrefix, keyHash, ownerName, role, dailyLimit, today, now);

    return {
      keyId,
      rawKey,
      role,
      dailyLimit
    };
  }

  /**
   * Validates token from incoming HTTP request (URL query or Authorization Bearer)
   * Enforces role quotas and returns validation outcome
   */
  public validateKey(token?: string | null): KeyValidationResult {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return { valid: false, error: 'missing_key' };
    }

    const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
    const keyHash = this.hashToken(cleanToken);
    const today = new Date().toISOString().slice(0, 10);

    const stmt = this.db.prepare(`SELECT * FROM api_keys WHERE key_hash = ?`);
    const record = stmt.get(keyHash) as ApiKeyRecord | undefined;

    if (!record) {
      return { valid: false, error: 'invalid_key' };
    }

    if (record.is_active !== 1) {
      return { valid: false, error: 'revoked_key', role: record.role, owner: record.owner_name };
    }

    // Daily reset check
    let currentUsage = record.usage_today;
    if (record.last_reset_date !== today) {
      currentUsage = 0;
      this.db.prepare(`UPDATE api_keys SET usage_today = 0, last_reset_date = ? WHERE key_id = ?`).run(today, record.key_id);
    }

    // Role-based authorization & quota check
    if (record.role === 'master' || record.daily_limit === -1) {
      // Master / Unlimited Key: record stats and allow unconditionally
      this.db.prepare(`UPDATE api_keys SET usage_today = usage_today + 1, total_usage = total_usage + 1 WHERE key_id = ?`).run(record.key_id);
      return { valid: true, role: record.role, owner: record.owner_name, remainingToday: -1 };
    }

    if (currentUsage >= record.daily_limit) {
      return {
        valid: false,
        error: 'daily_limit_exceeded',
        role: record.role,
        owner: record.owner_name,
        remainingToday: 0
      };
    }

    // Increment usage
    this.db.prepare(`UPDATE api_keys SET usage_today = usage_today + 1, total_usage = total_usage + 1 WHERE key_id = ?`).run(record.key_id);

    return {
      valid: true,
      role: record.role,
      owner: record.owner_name,
      remainingToday: record.daily_limit - (currentUsage + 1)
    };
  }

  public listKeys(): Omit<ApiKeyRecord, 'key_hash'>[] {
    const stmt = this.db.prepare(`
      SELECT key_id, key_prefix, owner_name, role, daily_limit, usage_today, total_usage, last_reset_date, is_active, created_at
      FROM api_keys
      ORDER BY created_at DESC
    `);
    return stmt.all() as Omit<ApiKeyRecord, 'key_hash'>[];
  }

  public revokeKey(keyIdOrPrefix: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE api_keys SET is_active = 0
      WHERE key_id = ? OR key_prefix LIKE ?
    `);
    const result = stmt.run(keyIdOrPrefix, `${keyIdOrPrefix}%`);
    return Number(result.changes) > 0;
  }

  public close(): void {
    try {
      this.db.close();
    } catch {}
  }
}
