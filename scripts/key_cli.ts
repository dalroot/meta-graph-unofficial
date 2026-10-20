#!/usr/bin/env node
/**
 * TwinGraph API Key Management CLI
 * 
 * Usage:
 *   npx tsx scripts/key_cli.ts create --name "Hokar" --role master
 *   npx tsx scripts/key_cli.ts create --name "Developer 1" --role free --limit 100
 *   npx tsx scripts/key_cli.ts list
 *   npx tsx scripts/key_cli.ts revoke <key_id>
 *   npx tsx scripts/key_cli.ts validate <token>
 */

import { ApiKeyManager, type KeyRole } from '../dist/auth/api_key_manager.js';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      result[key] = val;
    } else if (!result.command) {
      result.command = arg;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manager = new ApiKeyManager();
  const command = args.command || 'help';

  console.log('===============================================================');
  console.log('🔑 TWINGRAPH API KEY VAULT (SQLite Persistent Engine)');
  console.log('===============================================================\n');

  switch (command) {
    case 'create': {
      const name = args.name || 'Owner';
      const role = (args.role as KeyRole) || 'free';
      const limit = args.limit ? parseInt(args.limit, 10) : undefined;

      const created = manager.createKey(name, role, { dailyLimit: limit });

      console.log('✅ NEW API KEY GENERATED SUCCESSFULLY:');
      console.log(`   Key ID:       ${created.keyId}`);
      console.log(`   Owner:        ${name}`);
      console.log(`   Role:         ${created.role.toUpperCase()} ${created.role === 'master' ? '(UNLIMITED ACCESS)' : ''}`);
      console.log(`   Daily Quota:  ${created.dailyLimit === -1 ? 'Unlimited' : created.dailyLimit.toLocaleString()} requests/day`);
      console.log('\n---------------------------------------------------------------');
      console.log('⚠️  RAW SECRET TOKEN (Copy now! Stored as SHA-256 hash only):');
      console.log(`\n   ${created.rawKey}\n`);
      console.log('---------------------------------------------------------------');
      console.log('Usage example:');
      console.log(`   curl "http://localhost:3000/v21.0/me?access_token=${created.rawKey}"`);
      break;
    }

    case 'list': {
      const keys = manager.listKeys();
      console.log(`Total Keys Registered: ${keys.length}\n`);

      if (keys.length === 0) {
        console.log('No keys registered yet. Run: npx tsx scripts/key_cli.ts create --name "Owner" --role master');
        break;
      }

      console.table(keys.map(k => ({
        ID: k.key_id,
        Prefix: k.key_prefix,
        Owner: k.owner_name,
        Role: k.role,
        DailyLimit: k.daily_limit === -1 ? 'Unlimited' : k.daily_limit,
        UsedToday: k.usage_today,
        TotalUsed: k.total_usage,
        Active: k.is_active === 1 ? 'ACTIVE' : 'REVOKED',
        CreatedAt: k.created_at.slice(0, 16).replace('T', ' ')
      })));
      break;
    }

    case 'revoke': {
      const target = process.argv.slice(2)[1];
      if (!target) {
        console.error('Error: Please specify key ID or prefix to revoke.');
        process.exit(1);
      }
      const success = manager.revokeKey(target);
      if (success) {
        console.log(`✅ Key '${target}' has been REVOKED immediately.`);
      } else {
        console.log(`❌ Key '${target}' not found.`);
      }
      break;
    }

    case 'validate': {
      const token = process.argv.slice(2)[1];
      if (!token) {
        console.error('Error: Please provide a token to validate.');
        process.exit(1);
      }
      const res = manager.validateKey(token);
      console.log('Validation Outcome:', res);
      break;
    }

    default:
      console.log('Available Commands:');
      console.log('  create --name <Owner> [--role master|pro|free] [--limit <num>]');
      console.log('  list');
      console.log('  revoke <key_id_or_prefix>');
      console.log('  validate <token>');
      break;
  }

  console.log('\n===============================================================');
  manager.close();
}

main().catch(console.error);
