/**
 * env.ts — Server Startup Environment Validator
 *
 * Validates that all required environment variables are set before the application
 * begins handling requests. Refuses server boot in production if critical variables are missing.
 */

const CRITICAL_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const RECOMMENDED_ENV_VARS = [
  'NEXT_SUPABASE_SERVICE_ROLE_KEY',
  'INVITE_SECRET',
  'TOTP_ENCRYPTION_KEY',
  'NID_ENCRYPTION_KEY',
  'CRON_SECRET',
  'OWNER_EMAIL',
] as const;

export function validateEnv() {
  const missingCritical: string[] = [];
  const missingRecommended: string[] = [];

  for (const key of CRITICAL_ENV_VARS) {
    if (!process.env[key]) {
      missingCritical.push(key);
    }
  }

  for (const key of RECOMMENDED_ENV_VARS) {
    if (!process.env[key]) {
      missingRecommended.push(key);
    }
  }

  if (missingRecommended.length > 0) {
    console.warn(
      `[Env Check] Warning: Recommended environment variables are not set: ${missingRecommended.join(', ')}. ` +
      `Some optional features or encryption fallbacks may be disabled.`
    );
  }

  if (missingCritical.length > 0) {
    const errorMsg =
      `[FATAL] Missing critical environment variables: ${missingCritical.join(', ')}. ` +
      `The application cannot start without these variables configured in .env.local or production settings.`;

    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    } else {
      console.error(errorMsg);
    }
  }
}
