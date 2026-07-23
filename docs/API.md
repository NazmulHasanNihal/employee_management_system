# OpsHub API Documentation

Server actions and REST endpoints available in the Employee Management System.

## Base URL

- **Production:** `https://opshub-three.vercel.app`
- **Local dev:** `http://localhost:3000`

## Authentication

All mutations and protected reads require an authenticated Supabase session. Include the session cookie automatically sent by the browser, or use the `Authorization: Bearer <token>` header for API routes.

## Server Actions (Primary API)

The UI calls typed `trpc.<domain>.<method>()` proxies (`src/lib/trpc/client.ts`), which dispatch to server actions in `src/app/actions/db.ts`. Every action enforces RBAC via `getCaller()`.

### Attendance

| Action | Description | RBAC |
|---|---|---|
| `attendance.getLogs` | Get attendance records | Employee (own), Admin/HR (all) |
| `attendance.getAdminStats` | Admin attendance summary | Admin/HR |
| `attendance.getActiveSession` | Current clock-in session | Employee (own) |
| `attendance.clockIn` | Clock in with shift/late/geo checks | Employee |
| `attendance.clockOut` | Clock out | Employee (own session) |

### Leave

| Action | Description | RBAC |
|---|---|---|
| `leave.getRequests` | List leave requests | Employee (own), Admin/HR (all) |
| `leave.getBalance` | Leave balance summary | Employee (own) |
| `leave.submitRequest` | Submit leave request | Employee |
| `leave.updateStatus` | Approve/reject leave | Admin/HR |
| `leave.requestLeave` | Alias for submit request | Employee |

### Payroll

| Action | Description | RBAC |
|---|---|---|
| `payroll.getPayrolls` | List payroll runs | Employee (own payslips), Admin/HR (all) |
| `payroll.getHeads` | Payroll head config | Admin/HR |
| `payroll.getStructures` | Payroll structures | Admin/HR |
| `payroll.getFestivalBonuses` | Festival bonus records | Admin/HR |
| `payroll.getPayments` | Payment ledger | Admin/HR |
| `payroll.getAdminStats` | Payroll admin summary | Admin/HR |
| `payroll.getRunPreview` | Preview payroll run | Admin/HR |
| `payroll.createHead` | Create payroll head | Admin |
| `payroll.createStructure` | Create payroll structure | Admin |
| `payroll.grantFestivalBonus` | Grant festival bonus | Admin/HR |
| `payroll.runAutomatedPayroll` | Run automated payroll | Admin |
| `payroll.recordPayment` | Record payment | Admin/HR |
| `payroll.markPaymentPaid` | Mark payment as paid | Admin/HR |
| `payroll.recordSale` | Record sale (variable pay) | Admin/HR |

### Recruitment

| Action | Description | RBAC |
|---|---|---|
| `recruitment.getJobs` | List job postings | Public/Employee |
| `recruitment.createJob` | Create job posting | Admin/HR |
| `recruitment.updateCandidateStatus` | Update candidate stage | Admin/HR |
| `recruitment.updateCandidate` | Update candidate profile | Admin/HR |
| `recruitment.findInternalMatches` | Match internal talent to job | Admin/HR |

### Performance

| Action | Description | RBAC |
|---|---|---|
| `performance.getObjectives` | List OKRs/objectives | Employee (own/team), Admin/HR (all) |
| `performance.getReviews` | Performance reviews | Employee (own), Manager (team), Admin/HR (all) |
| `performance.createObjective` | Create objective | Employee/Manager |
| `performance.updateObjectiveProgress` | Update OKR progress | Employee/Owner/Manager |
| `performance.createCalibrationSession` | Create calibration | Admin/HR |
| `performance.addCalibrationEntry` | Add calibration entry | Admin/HR |
| `performance.lockCalibrationSession` | Lock calibration | Admin/HR |

### Registry (Employee Management)

| Action | Description | RBAC |
|---|---|---|
| `registry.getAll` | List all employees | Admin/HR |
| `registry.searchEmployees` | Search employees | Admin/HR |
| `registry.createEmployee` | Create employee record | Admin |
| `registry.updateEmployee` | Update employee profile | Admin/HR (own profile allowed for some fields) |
| `registry.deleteEmployee` | Offboard employee | Admin |
| `registry.updatePermissions` | Update user permissions | Admin |

### Org Chart

| Action | Description | RBAC |
|---|---|---|
| `orgchart.getOrgData` | Full org chart data | Admin/HR |
| `orgchart.getTree` | Tree view data | Employee (own org), Admin/HR (all) |

### Notifications

| Action | Description | RBAC |
|---|---|---|
| `notifications.getAll` | List notifications | Employee (own) |
| `notifications.markRead` | Mark single notification read | Employee (own) |
| `notifications.markAllRead` | Mark all notifications read | Employee (own) |
| `notifications.savePushSub` | Save push subscription | Employee (own) |
| `notifications.removePushSub` | Remove push subscription | Employee (own) |

### Team

| Action | Description | RBAC |
|---|---|---|
| `team.getMyTeam` | Current user's team | Employee |
| `team.getChainOfCommand` | Manager chain | Employee |
| `team.getTeamTasks` | Team tasks | Employee |
| `team.getTeamPerformance` | Team performance metrics | Manager/Admin |
| `team.getProxyStatus` | Proxy/delegation status | Employee |
| `team.createTask` | Create team task | Manager/Admin |
| `team.updateTaskStatus` | Update task status | Manager/Admin/Assignee |
| `team.deleteTask` | Delete task | Manager/Admin/Owner |
| `team.setProxy` | Set proxy/delegate | Manager/Admin |
| `team.clearProxy` | Clear proxy | Manager/Admin |

### Expenses

| Action | Description | RBAC |
|---|---|---|
| `expenses.getAll` | All expenses | Admin/HR |
| `expenses.getMyExpenses` | My expenses | Employee |
| `expenses.getPenalties` | Expense penalties | Admin/HR |
| `expenses.createExpense` | Submit expense | Employee |
| `expenses.updateStatus` | Approve/reject expense | Admin/HR |
| `expenses.createPenalty` | Create penalty | Admin/HR |
| `expenses.updatePenaltyStatus` | Update penalty status | Admin/HR |

### Helpdesk

| Action | Description | RBAC |
|---|---|---|
| `helpdesk.getTickets` | List tickets | Employee (own), Admin/HR (all) |
| `helpdesk.createTicket` | Create ticket | Employee |
| `helpdesk.addReply` | Add reply to ticket | Employee (own), Admin/HR |
| `helpdesk.updateTicketStatus` | Update ticket status | Admin/HR |

### Shifts

| Action | Description | RBAC |
|---|---|---|
| `shifts.getShifts` | List shifts | Employee |
| `shifts.getAssignments` | Shift assignments | Employee |
| `shifts.getTeams` | Shift teams | Manager/Admin |
| `shifts.assignShift` | Assign shift | Manager/Admin |
| `shifts.removeAssignment` | Remove shift assignment | Manager/Admin |
| `shifts.autoGenerateRoster` | Auto-generate roster | Manager/Admin |
| `shifts.createShift` | Create shift pattern | Admin |
| `shifts.updateShift` | Update shift | Admin |
| `shifts.deleteShift` | Delete shift | Admin |
| `shifts.createTeam` | Create shift team | Admin |
| `shifts.updateTeam` | Update shift team | Admin |
| `shifts.deleteTeam` | Delete shift team | Admin |

### Compliance

| Action | Description | RBAC |
|---|---|---|
| `compliance.getMyCertifications` | My certifications | Employee |
| `compliance.getExpiringCertifications` | Expiring certs | Admin/HR |
| `compliance.getWhistleblowerReports` | Whistleblower reports | Admin/HR |
| `compliance.addCertification` | Add certification | Admin/HR |
| `compliance.submitWhistleblower` | Submit whistleblower report | Employee |

### Benefits

| Action | Description | RBAC |
|---|---|---|
| `benefits.getEmployeeBenefits` | Employee benefits | Employee |
| `benefits.getEquityGrants` | Equity grants | Employee |
| `benefits.getActiveEnrollmentPeriod` | Enrollment period | Employee |
| `benefits.enrollBenefit` | Enroll in benefit | Employee |

### Documents

| Action | Description | RBAC |
|---|---|---|
| `documents.getDocuments` | List documents | Employee (own), Admin/HR (all) |
| `documents.createDocument` | Upload document | Employee/Admin/HR |
| `documents.signDocument` | E-sign document | Employee |

### Profile

| Action | Description | RBAC |
|---|---|---|
| `profile.getSkills` | Get user skills | Employee (own) |
| `profile.getDocuments` | Get profile documents | Employee (own) |
| `profile.updateMyProfile` | Update own profile | Employee |
| `profile.addSkill` | Add skill | Employee |
| `profile.removeSkill` | Remove skill | Employee |
| `profile.uploadDocument` | Upload profile doc | Employee |

### Dashboard

| Action | Description | RBAC |
|---|---|---|
| `dashboard.getStats` | Dashboard stats | Employee (own), Admin/HR (org) |
| `dashboard.getFullStats` | Full org stats | Admin/HR |
| `dashboard.getMyOverview` | My overview widgets | Employee |

### Applications (ATS)

| Action | Description | RBAC |
|---|---|---|
| `applications.list` | List job applications | Admin/HR |
| `applications.submit` | Submit application | Candidate/Employee |
| `applications.updateStatus` | Update application status | Admin/HR |

### Automations

| Action | Description | RBAC |
|---|---|---|
| `automations.list` | List automation rules | Admin |
| `automations.create` | Create automation rule | Admin |
| `automations.toggle` | Toggle rule active | Admin |
| `automations.remove` | Delete automation rule | Admin |

### DEI

| Action | Description | RBAC |
|---|---|---|
| `dei.getBiasAudit` | Salary bias audit data | Admin/HR |

### News & Announcements

| Action | Description | RBAC |
|---|---|---|
| `news.getAll` | List news | Employee |
| `news.create` | Create news | Admin/HR |
| `news.update` | Update news | Admin/HR |
| `news.delete` | Delete news | Admin/HR |
| `announcements.getAll` | List announcements | Employee |
| `announcements.create` | Create announcement | Admin/HR |
| `announcements.update` | Update announcement | Admin/HR |
| `announcements.delete` | Delete announcement | Admin/HR |
| `announcements.markRead` | Mark announcement read | Employee (own) |

### Engagement

| Action | Description | RBAC |
|---|---|---|
| `engagement.getRecent` | Recent engagement activity | Employee |
| `engagement.greetings` | Greeting messages/templates | Admin |
| `engagement.setRuleActive` | Toggle greeting rule | Admin |

### Feedback

| Action | Description | RBAC |
|---|---|---|
| `feedback.getAllFeedback` | List feedback | Employee (own/team), Admin/HR (all) |
| `feedback.submitFeedback` | Submit feedback | Employee |
| `feedback.updateFeedbackStatus` | Update feedback status | Admin/HR |

### Kudos (Recognition)

| Action | Description | RBAC |
|---|---|---|
| `kudo.getRecentKudos` | Recent kudos | Employee |
| `kudo.sendKudo` | Send kudo | Employee |

### Audit

| Action | Description | RBAC |
|---|---|---|
| `audit.getLogs` | Audit log entries | Admin/HR |

### Hierarchy

| Action | Description | RBAC |
|---|---|---|
| `hierarchy.getHierarchy` | Org hierarchy data | Admin/HR |

### Settings

| Action | Description | RBAC |
|---|---|---|
| `settings.getSystemSettings` | Get system settings | Admin |
| `settings.setSystemSetting` | Update system setting | Admin |

### Training (LMS)

| Action | Description | RBAC |
|---|---|---|
| `training.catalog` | Training catalog | Employee |
| `training.myTraining` | My enrolled training | Employee |
| `training.enroll` | Enroll in training | Employee |
| `training.updateProgress` | Update progress | Employee |
| `training.unenroll` | Unenroll from training | Employee |

### Whistleblower

| Action | Description | RBAC |
|---|---|---|
| `whistleblower.reports` | List reports | Admin/HR |
| `whistleblower.updateStatus` | Update report status | Admin/HR |
| `whistleblower.assign` | Assign report | Admin/HR |

### Reviews (PMS)

| Action | Description | RBAC |
|---|---|---|
| `reviews.getMine` | My performance reviews | Employee |
| `reviews.submit` | Submit review | Employee |

### Workflows

| Action | Description | RBAC |
|---|---|---|
| `workflows.createTask` | Create workflow task | Admin/HR |
| `workflows.toggleTask` | Toggle task completion | Admin/HR |
| `workflows.triggerProbationPlan` | Trigger probation plan | Admin/HR |
| `workflows.triggerOffboarding` | Trigger offboarding workflow | Admin/HR |
| `workflows.finalizeSeverance` | Finalize severance | Admin/HR |

### Presence

| Action | Description | RBAC |
|---|---|---|
| `presence.getActive` | Active presence data | Employee |

## REST API Routes

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/invite/accept` | No | Accept invite token and set password |
| GET | `/api/invite/verify` | No | Verify invite token validity |
| GET | `/api/onboarding` | Yes | Onboarding status check |

### Uploads

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | Yes | Upload file (magic-byte validation, 10MB cap, allowlist) |

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications/subscribe` | Yes | Subscribe to push notifications |
| GET | `/api/notifications/unsubscribe` | Yes | Unsubscribe from push |
| POST | `/api/notifications/trigger` | Yes (Bearer token) | Trigger notification to user |

### Hierarchy

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/hierarchy` | Yes | Org hierarchy data |

### Audit

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/audit` | Yes | Audit log entries |

### Cron (Protected by CRON_SECRET)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cron/greetings` | CRON_SECRET | Daily birthday/anniversary/festival greetings |
| GET | `/api/cron/absence` | CRON_SECRET | Daily absence detection |
| GET | `/api/cron/backup-verify` | CRON_SECRET | Database health check |

## Client tRPC Proxy

The frontend uses a lightweight tRPC shim (`src/lib/trpc/client.ts`) that maps dotted paths to server actions:

```ts
// Example: trpc.attendance.clockIn({})
// Maps to: executeServerMutation('attendance.clockIn')
// Which calls: (await import('@/app/actions/db')).attendanceClockIn(data)
```

## Error Codes

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | Caller lacks required role |
| `VALIDATION` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Unique constraint or state conflict |
| `RATE_LIMIT` | Rate limit exceeded |
| `AUTH_FAILED` | Authentication failure |
| `UNKNOWN` | Unexpected server error |

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| Login (`loginWithRateLimit`) | 10 attempts | 15 minutes |
| Provision/Invite (`provisionKey`) | 20 attempts | 1 hour |

Redis-backed in production (Upstash), in-memory sliding window in single-instance dev.
