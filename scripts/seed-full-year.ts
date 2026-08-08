/**
 * seed-full-year.ts
 *
 * Seeds one full year of operational data (08-08-2025 to 08-08-2026):
 *   - Attendance records for every working day (Sun-Thu, BD calendar)
 *   - Leave requests spread across the year
 *   - Monthly payroll + payment records for 12 months
 *   - Expenses, tasks, calendar events, penalties, bonuses across the year
 *   - Updates all employees with realistic DiceBear avatar URLs
 *
 * Run: pnpm tsx scripts/seed-full-year.ts
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Bangladeshi Holiday Calendar 2025-2026 ───
const BD_HOLIDAYS: string[] = [
  '2025-08-15', '2025-09-17', '2025-10-02', '2025-11-04',
  '2025-12-16', '2025-12-25',
  '2026-01-01', '2026-02-21', '2026-03-17', '2026-03-20',
  '2026-03-26', '2026-03-29', '2026-03-30', '2026-03-31',
  '2026-04-14', '2026-05-01', '2026-05-25',
  '2026-06-04', '2026-06-05', '2026-06-06',
  '2026-07-01', '2026-07-25', '2026-08-05',
];
const holidaySet = new Set(BD_HOLIDAYS);

function isWorkday(d: Date): boolean {
  const day = d.getDay();
  if (day === 5 || day === 6) return false;
  const iso = d.toISOString().split('T')[0];
  if (holidaySet.has(iso)) return false;
  return true;
}

function dateRange(startStr: string, endStr: string): Date[] {
  const dates: Date[] = [];
  const cur = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function realisticAvatar(seed: string): string {
  const style = 'notionists-neutral';
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&radius=50&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function main() {
  console.log('\n🚀 Seeding ONE FULL YEAR of data (08-08-2025 → 08-08-2026)...\n');

  const allUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, email: true, baseSalary: true, gender: true, role: true, department: true },
  });
  console.log(`📋 Found ${allUsers.length} active employees`);
  if (allUsers.length === 0) { console.log('⚠️  No active users. Run seed-100-bd.ts first.'); return; }

  const owner = allUsers.find(u => u.role === 'CEO' || u.role === 'Admin') || allUsers[0];
  const allUserIds = allUsers.map(u => u.id);

  // ─── 1. Update avatars ───
  console.log('🖼️  Updating avatars to realistic DiceBear profile images…');
  let avatarCount = 0;
  for (const u of allUsers) {
    await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: realisticAvatar(u.email) } });
    avatarCount++;
  }
  console.log(`✅ Avatars: ${avatarCount} updated`);

  // ─── 2. Clear old records ───
  console.log('🧹 Clearing old records…');
  await prisma.attendance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.paymentRecord.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.calendarEvent.deleteMany({});
  await prisma.teamTask.deleteMany({});
  await prisma.penalty.deleteMany({});
  await prisma.festivalBonus.deleteMany({});
  console.log('✅ Old records cleared');

  // ─── 3. ATTENDANCE ───
  console.log('📊 Seeding full-year attendance…');
  const allDates = dateRange('2025-08-08', '2026-08-08');
  const workdays = allDates.filter(isWorkday);
  console.log(`   Working days: ${workdays.length}`);

  let totalAttendance = 0;
  const BATCH_SIZE = 5000;
  let attendanceBatch: any[] = [];

  for (const date of workdays) {
    for (const uid of allUserIds) {
      if (Math.random() > 0.88) continue;
      const clockInHour = 8 + Math.floor(Math.random() * 2);
      const clockInMin = Math.floor(Math.random() * 60);
      const clockIn = new Date(date);
      clockIn.setUTCHours(clockInHour, clockInMin, 0, 0);
      const clockOut = new Date(clockIn);
      clockOut.setUTCHours(clockIn.getUTCHours() + 8 + Math.floor(Math.random() * 2));
      const isLate = clockInHour >= 9 && clockInMin > 15;
      const workedMs = clockOut.getTime() - clockIn.getTime();
      const workedMinutes = Math.round(workedMs / 60000);
      const overtimeMinutes = workedMinutes > 480 ? workedMinutes - 480 : 0;

      attendanceBatch.push({
        userId: uid, date: new Date(date), clockIn, clockOut,
        status: isLate ? 'Late' : 'Present', workedMinutes,
        lateMinutes: isLate ? (clockInHour - 9) * 60 + clockInMin : 0,
        overtimeMinutes,
      });

      if (attendanceBatch.length >= BATCH_SIZE) {
        const result = await prisma.attendance.createMany({ data: attendanceBatch, skipDuplicates: true });
        totalAttendance += result.count;
        process.stdout.write(`   …${totalAttendance} attendance records\r`);
        attendanceBatch = [];
      }
    }
  }
  if (attendanceBatch.length > 0) {
    const result = await prisma.attendance.createMany({ data: attendanceBatch, skipDuplicates: true });
    totalAttendance += result.count;
  }
  console.log(`\n✅ Attendance: ${totalAttendance.toLocaleString()} records`);

  // ─── 4. LEAVE REQUESTS ───
  console.log('🏖️  Seeding full-year leave requests…');
  const leaveTypes = ['Casual Leave', 'Earned Leave', 'Sick Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave'];
  const leaveReasons = ['Family event', 'Medical appointment', 'Personal work', 'Travel', 'Not feeling well', 'Religious obligation', 'Wedding ceremony', 'Child school event', 'Home renovation', 'Family emergency'];
  const leaveStatuses = ['Pending', 'Approved', 'Approved', 'Approved', 'Approved', 'Rejected'];
  let leaveCount = 0;

  for (const uid of allUserIds) {
    const numLeaves = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numLeaves; i++) {
      const monthOffset = Math.floor(Math.random() * 12);
      const year = monthOffset < 5 ? 2025 : 2026;
      const month = monthOffset < 5 ? 7 + monthOffset : monthOffset - 5;
      const day = Math.floor(Math.random() * 27) + 1;
      const startDate = new Date(year, month, day);
      const days = Math.floor(Math.random() * 5) + 1;
      const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + days);
      try {
        await prisma.leaveRequest.create({ data: { userId: uid, type: pick(leaveTypes), startDate, endDate, days, details: pick(leaveReasons), status: pick(leaveStatuses) } });
        leaveCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Leave requests: ${leaveCount}`);

  // ─── 5. MONTHLY PAYROLL ───
  console.log('💰 Seeding 12 months of payroll…');
  let payrollCount = 0, paymentCount = 0, paymentRecordCount = 0;
  const banks = ['Sonali Bank', 'Dutch-Bangla Bank', 'BRAC Bank', 'City Bank', 'Standard Chartered', 'Eastern Bank'];

  for (let mi = 0; mi < 12; mi++) {
    const year = mi < 5 ? 2025 : 2026;
    const month = mi < 5 ? 7 + mi : mi - 5;
    const monthName = MONTH_NAMES[month];
    const monthShort = MONTH_SHORT[month];

    for (let ui = 0; ui < allUsers.length; ui++) {
      const u = allUsers[ui];
      const base = u.baseSalary || 50000;
      const earnings = Math.round(base * 1.4 + 2500);
      const deductions = Math.round(base * 0.15);
      const net = earnings - deductions;
      try {
        const payroll = await prisma.payroll.create({ data: {
          userId: u.id, month: monthShort, year, status: 'PROCESSED', totalAmount: net, currency: 'BDT',
          earnings, deductions,
          earningsBreakdown: [{ head: 'Basic Salary', amount: base }, { head: 'House Rent', amount: Math.round(base * 0.4) }, { head: 'Medical', amount: 1500 }, { head: 'Conveyance', amount: 1000 }],
          deductionsBreakdown: [{ head: 'Provident Fund', amount: Math.round(base * 0.1) }, { head: 'TDS', amount: Math.round(base * 0.05) }],
        }});
        payrollCount++;
        await prisma.payment.create({ data: { payrollId: payroll.id, userId: u.id, month: month + 1, year, amount: net, method: pick(['BANK', 'BANK', 'BKASH', 'ROCKET']), reference: `TRX-${year}-${(month+1).toString().padStart(2,'0')}-${(ui+1).toString().padStart(3,'0')}`, status: 'PAID', details: `${monthName} ${year} Salary for ${u.name}` }});
        paymentCount++;
        await prisma.paymentRecord.create({ data: { trxId: `TXN-${year}${(month+1).toString().padStart(2,'0')}-${(ui+1).toString().padStart(4,'0')}`, userId: u.id, disbursedById: owner.id, paymentType: 'SALARY', paymentMethod: ui % 3 === 0 ? 'BKASH' : 'BANK_TRANSFER', batchType: 'BULK_BATCH', batchRef: `BATCH-${monthShort.toUpperCase()}-${year}`, bankName: ui % 3 === 0 ? 'bKash' : pick(banks), accountNumber: `2019${(ui+10000)}`, branchName: 'Gulshan Branch, Dhaka', baseAmount: base, bonuses: 0, adjustments: 0, deductions, netPaidAmount: net, remarks: `${monthName} ${year} Salary`, status: 'DISBURSED' }});
        paymentRecordCount++;
      } catch { /* skip */ }
    }
    console.log(`   ✓ ${monthName} ${year}`);
  }
  console.log(`✅ Payrolls: ${payrollCount}, Payments: ${paymentCount}, Records: ${paymentRecordCount}`);

  // ─── 6. EXPENSES ───
  console.log('💸 Seeding full-year expenses…');
  const expenseDescs = ['Uber/CNG ride', 'Internet bill', 'Client lunch', 'Office supplies', 'Course fee', 'Fuel for visit', 'Medical checkup', 'Conference fee'];
  let expenseCount = 0;
  for (const uid of allUserIds.slice(0, 60)) {
    for (let m = 0; m < 12; m++) {
      const year = m < 5 ? 2025 : 2026;
      const month = m < 5 ? 7 + m : m - 5;
      for (let k = 0; k < 1 + Math.floor(Math.random() * 3); k++) {
        try {
          await prisma.expense.create({ data: { userId: uid, category: pick(['Travel','Conveyance','Client Entertainment','Office Supplies','Internet Stipend','Training & Courses','Fuel','Medical']), amount: Math.floor(Math.random() * 12000) + 500, description: pick(expenseDescs), status: pick(['APPROVED','APPROVED','APPROVED','PENDING','REJECTED']), isMileage: Math.random() > 0.75, createdAt: new Date(year, month, Math.floor(Math.random()*27)+1) }});
          expenseCount++;
        } catch { /* skip */ }
      }
    }
  }
  console.log(`✅ Expenses: ${expenseCount}`);

  // ─── 7. TASKS ───
  console.log('📋 Seeding full-year tasks…');
  const taskTitles = ['Complete quarterly report','Update documentation','Fix production bug','Design feature mockup','Review PRs','Prepare training material','Client follow-up','Inventory audit','Performance review prep','Code refactoring','Security audit','Onboarding','Update SOPs','KPI review','Budget draft','DB optimization','API testing','UAT','Vendor evaluation','Team retro'];
  let taskCount = 0;
  for (let m = 0; m < 12; m++) {
    const year = m < 5 ? 2025 : 2026;
    const month = m < 5 ? 7 + m : m - 5;
    for (let i = 0; i < 15 + Math.floor(Math.random()*11); i++) {
      const assignee = pick(allUserIds);
      try {
        await prisma.teamTask.create({ data: { title: pick(taskTitles), description: 'Auto-generated task.', status: pick(['ToDo','InProgress','InProgress','Done','Done','Done']), priority: pick(['Low','Medium','High','Critical']), assigneeId: assignee, assignerId: pick(allUserIds.filter(id => id !== assignee)), dueDate: new Date(year, month, Math.floor(Math.random()*27)+1) }});
        taskCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Tasks: ${taskCount}`);

  // ─── 8. CALENDAR EVENTS ───
  console.log('📅 Seeding full-year events…');
  const eventTitles = ['All Hands','Sprint Planning','Team Standup','Quarterly Review','Client Presentation','Training','Department Meetup','Budget Review','Strategy Session','Product Launch','Town Hall','Annual Day','Team Building','Workshop','Hackathon'];
  let eventCount = 0;
  for (let m = 0; m < 12; m++) {
    const year = m < 5 ? 2025 : 2026;
    const month = m < 5 ? 7 + m : m - 5;
    for (let i = 0; i < 3 + Math.floor(Math.random()*5); i++) {
      try {
        await prisma.calendarEvent.create({ data: { title: pick(eventTitles), description: 'Scheduled event.', type: pick(['Meeting','Reminder','Deadline','Social']), date: new Date(year, month, Math.floor(Math.random()*27)+1), creatorId: pick(allUserIds) }});
        eventCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Events: ${eventCount}`);

  // ─── 9. PENALTIES ───
  console.log('⚠️  Seeding penalties…');
  let penaltyCount = 0;
  for (let m = 0; m < 12; m++) {
    const year = m < 5 ? 2025 : 2026;
    const month = m < 5 ? 7 + m : m - 5;
    for (let i = 0; i < 2 + Math.floor(Math.random()*4); i++) {
      try {
        await prisma.penalty.create({ data: { userId: pick(allUserIds), amount: pick([500,1000,1500,2000]), reason: pick(['Late attendance','Unannounced absence','Missing standup','Unauthorized overtime']), status: pick(['UNPAID','PAID','PAID']), dueDate: new Date(year, month, 28) }});
        penaltyCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Penalties: ${penaltyCount}`);

  // ─── 10. FESTIVAL BONUSES ───
  console.log('🌙 Seeding festival bonuses…');
  let bonusCount = 0;
  for (const fest of [{ occasion: 'Eid-ul-Fitr', occasionBn: 'ঈদুল ফিতর', year: 2026 }, { occasion: 'Eid-ul-Adha', occasionBn: 'ঈদুল আযহা', year: 2026 }, { occasion: 'Durga Puja', occasionBn: 'দুর্গাপূজা', year: 2025 }]) {
    for (const uid of allUserIds.slice(0, 60)) {
      const u = allUsers.find(x => x.id === uid);
      const base = u?.baseSalary || 50000;
      try { await prisma.festivalBonus.create({ data: { userId: uid, year: fest.year, occasion: fest.occasion, occasionBn: fest.occasionBn, amount: base, baseSalarySnapshot: base, status: 'PAID' }}); bonusCount++; } catch { /* skip */ }
    }
  }
  console.log(`✅ Festival Bonuses: ${bonusCount}`);

  console.log('\n🎉 Full Year Seed Complete!');
  console.log(`   Date Range: 08-08-2025 → 08-08-2026`);
  console.log(`   Attendance: ${totalAttendance.toLocaleString()}`);
  console.log(`   Leave: ${leaveCount} | Payrolls: ${payrollCount} | Payments: ${paymentCount}`);
  console.log(`   Expenses: ${expenseCount} | Tasks: ${taskCount} | Events: ${eventCount}`);
  console.log(`   Penalties: ${penaltyCount} | Bonuses: ${bonusCount} | Avatars: ${avatarCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
