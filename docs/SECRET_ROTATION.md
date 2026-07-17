# Secret Rotation — Step-by-Step

Your `.env` currently holds **live production credentials** on disk. Rotate them
following this checklist. Do NOT skip steps — rotating without updating the app
will break logins and writes.

## 1. Supabase (highest risk — service-role key + DB password)
1. Go to Supabase Dashboard → your project → **Project Settings → Keys**.
2. Click **Reset** on the **service_role** key. Copy the new value.
3. Go to **Project Settings → Database → Connection string** (URI mode).
4. Reset the database password (Database → Password). Copy the new URI.
5. Update `DATABASE_URL` and `DIRECT_URL` in `.env` (and Vercel env vars).
6. Update `NEXT_SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Sentry
1. Sentry → **Settings → Developer Settings → Auth Tokens**.
2. Revoke the old `SENTRY_AUTH_TOKEN`, create a new one.
3. Update `.env` + Vercel.

## 3. VAPID (Web Push)
1. Generate a new VAPID key pair:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Update `VAPID_PRIVATE_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

## 4. Upstash Redis (BullMQ)
1. Upstash → your database → **REST API → Regenerate token**.
2. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## 5. Invite secret
1. Set a fresh `INVITE_SECRET` (any long random string).

## 6. Verify
After updating `.env` + Vercel and redeploying:
```bash
pnpm dev        # log in
# perform one write (e.g. create a leave request) and confirm it persists
```
A pre-commit hook blocks committing `.env`, so the new secrets stay local /
in Vercel only.

## 7. Confirm old keys are dead
Log out of the app, then confirm the old `service_role` key no longer works
(outside this repo). If the old key still authenticates, repeat step 1.
