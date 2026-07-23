# 2FA Admin Onboarding Checklist

Use this checklist when onboarding or securing admin accounts.

## For Each Admin User

- [ ] **Enable 2FA**
  - Log in to OpsHub
  - Go to **Profile → Security**
  - Click **Enable Two-Factor Authentication**
  - Scan QR code with authenticator app (Google Authenticator, Authy, 1Password, etc.)
  - Enter the 6-digit code to verify
  - Save the backup codes displayed (store securely offline)

- [ ] **Verify 2FA Login Flow**
  - Log out completely
  - Log back in — should see the 2FA code prompt after password
  - Enter code from authenticator app
  - Confirm successful login

- [ ] **Store Recovery Information**
  - Admin email confirmed in Supabase Auth
  - Phone number added to profile (for recovery)
  - Backup codes stored in secure password manager

- [ ] **Confirm Permissions**
  - Role is `Admin` or appropriate level
  - `isOwner` flag set only for primary owner
  - No unnecessary permission escalation

## System-Wide Settings

- [ ] **Set TOTP_ENCRYPTION_KEY** in Vercel environment variables
  - Generate: `node scripts/rotate-secrets.js`
  - Add to all environments (preview, production)

- [ ] **Enforce 2FA Policy** (future)
  - Consider making 2FA mandatory for admin/HR roles via middleware
  - Track adoption in admin dashboard

## Emergency Procedures

- **Lost authenticator device**: Admin can use backup codes to log in, then disable 2FA and re-enable with new device
- **Compromised admin account**: Immediately rotate secrets, disable admin access, audit logs
- **Locked out**: Use backup codes or contact system owner

## Rollout Order

1. Primary owner / super-admin first
2. HR managers second
3. Regular admins third
4. Communicate 2FA requirement to all admins before enforcement
