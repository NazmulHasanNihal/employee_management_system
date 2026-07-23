# EMS Runbook

Operational procedures for the Employee Management System.

## 1. Secret Rotation

### When to rotate
- Suspicion of credential leakage
- Employee departure with system access
- Quarterly preventive rotation for production keys

### How to rotate

1. Generate new values:
   - `NID_ENCRYPTION_KEY`: 32-byte base64 string
   - `VAPID_PRIVATE_KEY`: new key pair via `web-push generate-vapid-keys`
   - Supabase service-role key: Supabase Dashboard → Settings → API → Reset

2. Update secrets in the deployment platform (Vercel → Settings → Environment Variables).

3. Restart all deployment environments (preview + production).

4. Verify:
   - Login flows work
   - Push notifications still deliver
   - NID field-encryption/decryption succeeds (check onboarding flow)

## 2. Database Backup Verification

### Automated backups (Supabase)
Supabase provides daily automated backups. To verify:

1. Open Supabase Dashboard → Project Settings → Database → Backups
2. Confirm the latest backup timestamp is within the last 24 hours
3. Click "Restore" on a sandbox/staging database to verify backup integrity (do NOT restore to production)

### Manual backup (pg_dump)
```bash
pg_dump "$DATABASE_URL" -F c -f backups/ems_$(date +%Y%m%d).dump
```

### Automated backup script
Use `scripts/backup-db.js` for scheduled local backups with retention:

```bash
# Run daily via cron / Vercel Cron / CI:
node scripts/backup-db.js ./backups

# Environment variables:
# DATABASE_URL    - PostgreSQL connection string
# BACKUP_RETENTION - Number of backups to keep (default: 7)
```

The script compresses dumps with gzip and prunes old files automatically.

Verify size is non-zero and matches expected growth:
```bash
ls -lh backups/ems_*.dump
```

### Backup verification checklist
- [ ] Latest backup exists and is < 24h old
- [ ] Restore test succeeded on staging
- [ ] pg_dump file size > 0
- [ ] No error logs during backup creation

## 3. Disaster Recovery

### RTO / RPO targets
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours (daily backups)

### Recovery procedure

1. **Provision new database**
   ```bash
   # Create new Supabase project or restore existing
   psql "$DIRECT_URL" < backups/ems_latest.dump
   ```

2. **Run Prisma migrations** (if schema changed since backup)
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Re-deploy application**
   ```bash
   vercel deploy --prod
   ```

4. **Verify**
   - [ ] Homepage loads
   - [ ] Login succeeds
   - [ ] Critical paths work: attendance, leave, payroll
   - [ ] Sentry reports new errors? (replay)
   - [ ] PostHog events flowing?

### Rollback procedure
If a bad deployment causes issues:
```bash
vercel rollback
```

## 4. Health Checks

### Application health
- `/api/health` — should return 200
- `/api/audit` — should return 200 for admin users

### Database health
```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Redis health (rate limiting)
The app uses Upstash Redis. Verify via Upstash dashboard or:
```bash
curl -X GET "$UPSTASH_REDIS_REST_URL/PING"
```

## 5. Incident Response

1. Check Sentry for new error spikes
2. Check Vercel deployment logs
3. Check PostHog for user-impact metrics
4. Rollback if deployment is the cause
5. Notify stakeholders via the incident channel
6. Post-mortem within 48 hours

## 6. Common Issues

| Issue | Fix |
|---|---|
| Rate limit too strict | Adjust `max` in `src/lib/ratelimit.ts` |
| NID encryption fails | Verify `NID_ENCRYPTION_KEY` is set and 32 bytes |
| Push notifications failing | Verify VAPID keys and `pushSub` column exists |
| Build fails | Run `pnpm install` then `pnpm run build` |
| TypeScript errors | Run `pnpm exec tsc --noEmit` for diagnostics |
