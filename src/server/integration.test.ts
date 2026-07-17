/**
 * Integration tests — prove that writes actually persist (create/update/delete)
 * against a REAL database.
 *
 * SAFETY:
 *  - These tests ONLY run when `RUN_INTEGRATION=1` is set AND `DATABASE_URL`
 *    points at a NON-production host. They skip otherwise so a careless
 *    `pnpm test` never touches production.
 *  - Every created record is deleted in a `finally` block (best-effort) so the
 *    database is left clean.
 *
 * Run against STAGING only:
 *   DOTENV_CONFIG_PATH=.env.staging RUN_INTEGRATION=1 pnpm test src/server/integration.test.ts
 */
import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

const dbUrl = process.env.DATABASE_URL ?? '';
const isProd = dbUrl.includes('supabase.co') && !dbUrl.includes('staging');
const enabled = process.env.RUN_INTEGRATION === '1' && dbUrl.length > 0 && !isProd;

describe.skipIf(!enabled)('integration: data persists (staging only)', () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    // Cleanup: remove any records we created.
    for (const id of createdIds) {
      try {
        await prisma.user.deleteMany({ where: { id } });
      } catch {
        /* best-effort */
      }
    }
    await prisma.$disconnect();
  });

  it('creates and reads back a user record', async () => {
    const email = `integ-${Date.now()}@example.com`;
    const created = await prisma.user.create({
      data: {
        email,
        name: 'Integration Test User',
        role: 'Employee',
        status: 'active',

      },
    });
    createdIds.push(created.id);

    const read = await prisma.user.findUnique({ where: { id: created.id } });
    expect(read).not.toBeNull();
    expect(read?.email).toBe(email);
  });

  it('updates a user record and persists the change', async () => {
    const email = `integ-upd-${Date.now()}@example.com`;
    const created = await prisma.user.create({
      data: {
        email,
        name: 'Before Update',
        role: 'Employee',
        status: 'active',

      },
    });
    createdIds.push(created.id);

    await prisma.user.update({
      where: { id: created.id },
      data: { name: 'After Update' },
    });
    const read = await prisma.user.findUnique({ where: { id: created.id } });
    expect(read?.name).toBe('After Update');
  });

  it('deletes a user record', async () => {
    const email = `integ-del-${Date.now()}@example.com`;
    const created = await prisma.user.create({
      data: {
        email,
        name: 'To Delete',
        role: 'Employee',
        status: 'active',

      },
    });
    await prisma.user.delete({ where: { id: created.id } });
    const read = await prisma.user.findUnique({ where: { id: created.id } });
    expect(read).toBeNull();
  });

  it('perists a leave request and reflects status changes', async () => {
    const email = `integ-leave-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Leave Owner',
        role: 'Employee',
        status: 'active',

      },
    });
    createdIds.push(user.id);

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        type: 'Annual',
        status: 'Pending',
        startDate: new Date(),
        endDate: new Date(),
        details: 'integration test',
      },
    });
    expect(leave.id).toBeTruthy();

    await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: { status: 'Approved' },
    });
    const read = await prisma.leaveRequest.findUnique({ where: { id: leave.id } });
    expect(read?.status).toBe('Approved');

    await prisma.leaveRequest.delete({ where: { id: leave.id } });
  });
});
