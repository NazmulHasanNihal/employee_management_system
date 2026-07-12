import { router, publicProcedure } from '../trpc';
import { dashboardRouter } from './dashboard';
import { attendanceRouter } from './attendance';
import { applicationsRouter } from './applications';
import { registryRouter } from './registry';
import { payrollRouter } from './payroll';
import { profileRouter } from './profile';
import { auditRouter } from './audit';
import { messagesRouter } from './messages';
import { notificationsRouter } from './notifications';
import { announcementsRouter } from './announcements';
import { leaveRouter } from './leave';
import { expensesRouter } from './expenses';
import { shiftsRouter } from './shifts';
import { documentsRouter } from './documents';
import { departmentsRouter } from './departments';
import { assetsRouter } from './assets';
import { deiRouter } from './dei';
import { orgchartRouter } from './orgchart';
import { performanceRouter } from './performance';
import { helpdeskRouter } from './helpdesk';
import { benefitsRouter } from './benefits';
import { calendarRouter } from './calendar';
import { feedbackRouter } from './feedback';
import { recognitionRouter } from './recognition';
import { workflowsRouter } from './workflows';
import { recruitmentRouter } from './recruitment';
import { teamRouter } from './team';
import { complianceRouter } from './compliance';
export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: 'ok' };
  }),
  dashboard: dashboardRouter,
  attendance: attendanceRouter,
  applications: applicationsRouter,
  registry: registryRouter,
  payroll: payrollRouter,
  profile: profileRouter,
  audit: auditRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  announcements: announcementsRouter,
  leave: leaveRouter,
  expenses: expensesRouter,
  shifts: shiftsRouter,
  documents: documentsRouter,
  departments: departmentsRouter,
  assets: assetsRouter,
  dei: deiRouter,
  orgchart: orgchartRouter,
  performance: performanceRouter,
  helpdesk: helpdeskRouter,
  benefits: benefitsRouter,
  calendar: calendarRouter,
  feedback: feedbackRouter,
  recognition: recognitionRouter,
  workflows: workflowsRouter,
  recruitment: recruitmentRouter,
  team: teamRouter,
  compliance: complianceRouter,
});

export type AppRouter = typeof appRouter;
