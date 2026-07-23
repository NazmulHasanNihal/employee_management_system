import crypto from 'crypto';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

function generateRandomBytes(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64(length: number): string {
  return crypto.randomBytes(length).toString('base64');
}

function showValue(name: string, value: string, maskAfter = 8) {
  const masked = value.slice(0, maskAfter) + '...';
  console.log(`${name}=${masked}`);
}

function main() {
  console.log('=== Secret Rotation Script ===\n');

  const envFile = '.env';
  let envContent = '';
  try {
    envContent = readFileSync(envFile, 'utf8');
  } catch {
    console.log(`Warning: ${envFile} not found. Creating with new values.`);
  }

  const secrets: Record<string, string> = {};

  const targets = [
    { key: 'DATABASE_URL', type: 'external', note: 'Rotate via Supabase Dashboard → Settings → Database → Connection Pooling' },
    { key: 'DIRECT_URL', type: 'external', note: 'Rotate via Supabase Dashboard → Settings → Database' },
    { key: 'NEXT_SUPABASE_SERVICE_ROLE_KEY', type: 'external', note: 'Rotate via Supabase Dashboard → Settings → API → Reset' },
    { key: 'NID_ENCRYPTION_KEY', type: 'generate', length: 32, note: '32-byte hex key for NID encryption' },
    { key: 'TOTP_ENCRYPTION_KEY', type: 'generate', length: 32, note: '32-byte hex key for 2FA secret encryption' },
    { key: 'VAPID_PRIVATE_KEY', type: 'generate-vapid', note: 'Generate with: npx web-push generate-vapid-keys' },
    { key: 'UPSTASH_REDIS_REST_TOKEN', type: 'external', note: 'Rotate via Upstash Dashboard → API Keys' },
    { key: 'INVITE_SECRET', type: 'generate', length: 32, note: '32-byte hex key for invite tokens' },
    { key: 'CRON_SECRET', type: 'generate', length: 32, note: '32-byte hex key for cron auth' },
  ];

  console.log('Generated values (add these to your deployment platform):\n');

  for (const target of targets) {
    if (target.type === 'external') {
      console.log(`${target.key}: [MANUAL - ${target.note}]`);
      secrets[target.key] = envContent.match(new RegExp(`^${target.key}=(.*)$`, 'm'))?.[1] || '';
    } else if (target.type === 'generate') {
      const val = generateRandomBytes(target.length!);
      secrets[target.key] = val;
      showValue(target.key, val);
    } else if (target.type === 'generate-vapid') {
      console.log(`${target.key}: [Run: npx web-push generate-vapid-keys]`);
      const match = envContent.match(/^VAPID_PRIVATE_KEY=(.*)$/m);
      secrets[target.key] = match?.[1] || '';
    }
  }

  console.log('\n=== Next Steps ===');
  console.log('1. Update these values in Vercel → Settings → Environment Variables (all environments)');
  console.log('2. Update DATABASE_URL, DIRECT_URL, NEXT_SUPABASE_SERVICE_ROLE_KEY in Supabase Dashboard');
  console.log('3. Update UPSTASH_REDIS_REST_TOKEN in Upstash Dashboard');
  console.log('4. Generate new VAPID keys: npx web-push generate-vapid-keys');
  console.log('5. Restart all Vercel environments (preview + production)');
  console.log('6. Verify: login works, NID encryption still works, push notifications still work');
  console.log('7. Disable old keys after confirming new ones work');

  console.log('\n=== .env Preview ===');
  let newEnv = envContent;
  for (const [key, val] of Object.entries(secrets)) {
    if (val && !newEnv.match(new RegExp(`^${key}=`, 'm'))) {
      newEnv += `\n${key}=${val}`;
    }
  }
  console.log(newEnv);
}

main();
