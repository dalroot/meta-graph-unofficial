/**
 * API Key Manager & SQLite Persistent Security Vault
 *
 * Powered by native node:sqlite. Zero external dependencies.
 * Stores non-reversible SHA-256 key hashes and enforces tiered quotas.
 */
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
export declare class ApiKeyManager {
    private db;
    private dbPath;
    constructor(customDbPath?: string);
    private initSchema;
    hashToken(token: string): string;
    /**
     * Generates a new API key with cryptographically strong entropy
     * Returns the raw full key (only visible once upon creation)
     */
    createKey(ownerName: string, role?: KeyRole, options?: {
        dailyLimit?: number;
    }): {
        keyId: string;
        rawKey: string;
        role: KeyRole;
        dailyLimit: number;
    };
    /**
     * Validates token from incoming HTTP request (URL query or Authorization Bearer)
     * Enforces role quotas and returns validation outcome
     */
    validateKey(token?: string | null): KeyValidationResult;
    listKeys(): Omit<ApiKeyRecord, 'key_hash'>[];
    revokeKey(keyIdOrPrefix: string): boolean;
    close(): void;
}
