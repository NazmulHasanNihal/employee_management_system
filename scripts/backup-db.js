#!/usr/bin/env node
/**
 * Database backup script (P2 — operational).
 *
 * Creates a timestamped PostgreSQL dump of the EMS database.
 *
 * Usage:
 *   node scripts/backup-db.js [output-dir]
 *
 * Environment:
 *   DATABASE_URL       Required. PostgreSQL connection string.
 *   BACKUP_RETENTION   Optional. Number of backups to keep (default: 7).
 *
 * Requires: pg_dump in PATH (PostgreSQL client tools).
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getEnv(name: string, fallback?: string): string {
  const val = process.env[name];
  if (!val && !fallback) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return val || fallback!;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function main() {
  const databaseUrl = getEnv('DATABASE_URL');
  const outputDir = process.argv[2] || join(__dirname, '..', 'backups');
  const retention = parseInt(getEnv('BACKUP_RETENTION', '7'), 10);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const filename = `ems-backup-${timestamp()}.sql.gz`;
  const outputPath = join(outputDir, filename);

  console.log(`Backing up database to ${outputPath}...`);

  try {
    const result = execSync(
      `pg_dump "${databaseUrl}" --format=plain --no-owner --no-privileges | gzip > "${outputPath}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    const size = require('fs').statSync(outputPath).size;
    console.log(`Backup complete: ${filename} (${(size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('Backup failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const files = readdirSync(outputDir)
    .filter((f) => f.startsWith('ems-backup-') && f.endsWith('.sql.gz'))
    .sort()
    .reverse();

  for (let i = retention; i < files.length; i++) {
    unlinkSync(join(outputDir, files[i]));
    console.log(`Pruned old backup: ${files[i]}`);
  }

  console.log(`Retention: ${Math.min(files.length, retention)} backups kept.`);
}

main();
