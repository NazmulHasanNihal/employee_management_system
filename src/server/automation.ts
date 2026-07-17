/**
 * automation.ts — Execution engine for the Automations feature (Pillar 4).
 *
 * The Automations UI persists rules (trigger / action / condition). This runner
 * is the execution path: callers fire `runAutomationRules(trigger, ctx)` when a
 * domain event happens (employee added, leave requested, etc.). Matching Active
 * rules execute their action (best-effort) and record `lastRunAt`.
 *
 * Extracted from the monolithic `src/app/actions/db.ts` for maintainability.
 */
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function runAutomationRules(
  trigger: string,
  ctx: Record<string, unknown>,
  caller?: { id: string } | null,
): Promise<void> {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { trigger, status: 'Active' },
    });
    for (const rule of rules) {
      try {
        switch (rule.action) {
          case 'send_welcome': {
            const targetId = ctx.userId as string | undefined;
            if (targetId) {
              await prisma.notification.create({
                data: {
                  userId: targetId,
                  message: `Welcome to the team, ${ctx.name || 'colleague'}! Complete your onboarding to get started.`,
                  type: 'system',
                  link: '/profile',
                },
              });
            }
            break;
          }
          case 'notify_manager': {
            const managerId = ctx.managerId as string | undefined;
            const targetUserId = ctx.userId as string | undefined;
            if (managerId) {
              await prisma.notification.create({
                data: {
                  userId: managerId,
                  message: `${ctx.name || 'An employee'} ${ctx.detail || 'triggered an event'}`,
                  type: 'info',
                  link: '/applications',
                },
              });
            } else if (targetUserId) {
              // No manager: notify all admins/HR instead.
              const admins = await prisma.user.findMany({
                where: { role: { in: ['Admin', 'HR Manager'] } },
              });
              for (const admin of admins) {
                await prisma.notification.create({
                  data: {
                    userId: admin.id,
                    message: `${ctx.name || 'An employee'} ${ctx.detail || 'triggered an event'}`,
                    type: 'info',
                    link: '/applications',
                  },
                });
              }
            }
            break;
          }
          case 'auto_approve_leave': {
            // Best-effort: auto-approve if the context carries a leaveRequestId.
            const leaveId = ctx.leaveRequestId as string | undefined;
            if (leaveId) {
              await prisma.leaveRequest.update({
                where: { id: leaveId },
                data: { status: 'Approved' },
              });
            }
            break;
          }
          default:
            // Unknown action: no-op, but still stamp lastRunAt below.
            break;
        }
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: { lastRunAt: new Date() },
        });
      } catch (ruleErr) {
        logError(`Automation rule ${rule.id} (${trigger}/${rule.action}) failed:`, ruleErr);
      }
    }
  } catch (err) {
    logError('runAutomationRules error:', err);
  }
}
