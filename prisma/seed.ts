/**
 * seed.ts — EMS reference-data seed.
 *
 * Creates ONLY the system owner (admin/CEO) and the reference data the app
 * needs to function: departments, BD salary heads, leave types, a branch,
 * 2026 Bangladesh public holidays, a training catalog, document templates, and
 * the whistleblower ethics committee. No random/fake employees are created —
 * real users are added through onboarding / the registry.
 *
 * Run: pnpm ts-node prisma/seed.ts
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'nazmulhas36@gmail.com';
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product', 'Customer Support'];

// ── Bangladesh public/govt holidays for 2026 (verify official dates before use) ──
// * = date depends on lunar sighting; approximate.
const holidays2026: { date: string; name: string; nameBn: string; type: string }[] = [
  { date: '2026-02-21', name: 'Language Martyrs\' Day', nameBn: 'ভাষা শহিদ দিবস', type: 'National' },
  { date: '2026-03-17', name: 'Sheikh Mujibur Rahman\'s Birthday', nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন', type: 'National' },
  { date: '2026-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National' },
  { date: '2026-04-14', name: 'Bengali New Year', nameBn: 'পহেলা বৈশাখ', type: 'Festival' },
  { date: '2026-05-01', name: 'May Day', nameBn: 'মে দিবস', type: 'Public' },
  { date: '2026-05-22', name: 'Eid-ul-Fitr*', nameBn: 'ঈদ-উল-ফিতর*', type: 'Religious' },
  { date: '2026-07-24', name: 'Eid-ul-Adha*', nameBn: 'ঈদ-উল-আযহা*', type: 'Religious' },
  { date: '2026-08-16', name: 'Ashura*', nameBn: 'আশুরা*', type: 'Religious' },
  { date: '2026-10-21', name: 'Durga Puja (Bijoya Dashami)*', nameBn: 'দুর্গাপূজা*', type: 'Religious' },
  { date: '2026-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস', type: 'National' },
  { date: '2026-12-31', name: 'New Year\'s Eve', nameBn: 'নববর্ষের প্রাক্কাল', type: 'Public' },
];

async function main() {
  console.log('Clearing old data...');
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.salaryHead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.department.deleteMany();
  // Clear newly-added reference tables so re-running the seed is idempotent.
  await prisma.leaveType.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.trainingCourse.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.greetingRule.deleteMany();
  await prisma.greetingLog.deleteMany();
  await prisma.festivalBonus.deleteMany();
  await prisma.branchRelations.deleteMany();
  await prisma.branch.deleteMany();

  // Due to relation constraints, we must clear manager relationships before deleting users.
  await prisma.user.updateMany({ data: { managerId: null, proxyId: null } });
  // Keep the owner; remove everyone else.
  await prisma.user.deleteMany({ where: { email: { not: OWNER_EMAIL } } });

  console.log('Seeding reference data...');

  // 1. Departments (no random budgets — deterministic reference values).
  for (const name of departments) {
    await prisma.department.create({ data: { name, budget: 1_000_000 } });
  }

  // 2. System owner (CEO + isOwner = head of everything). Upsert by email so
  // re-running seed is idempotent. The id matches the real Supabase Auth user
  // so sessions resolve correctly via getCaller().
  const adminId = '451556d1-7c77-4899-b963-cf7ef17b2047';
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      name: 'Nazmul Admin',
      role: 'CEO',
      department: 'Executive',
      designation: 'Chief Executive Officer',
      status: 'active',
      isOnboarded: true,
      isOwner: true,
    },
    create: {
      id: adminId,
      name: 'Nazmul Admin',
      email: OWNER_EMAIL,
      role: 'CEO',
      department: 'Executive',
      designation: 'Chief Executive Officer',
      status: 'active',
      isOnboarded: true,
      isOwner: true,
    },
  });

  // 3. Bangladesh salary heads (B2 defaults).
  const salaryHeads = [
    { name: 'Basic Salary', displayNameBn: 'মূল বেতন', type: 'EARNING', isDefault: true, category: 'BASIC', calculationType: 'flat', isStatutory: false },
    { name: 'House Rent Allowance', displayNameBn: 'বাড়ি ভাড়া ভাতা', type: 'EARNING', isDefault: true, category: 'ALLOWANCE', calculationType: 'percentage_of_base', factor: 40, isStatutory: false },
    { name: 'Medical Allowance', displayNameBn: 'চিকিৎসা ভাতা', type: 'EARNING', isDefault: true, category: 'ALLOWANCE', calculationType: 'flat', isStatutory: false },
    { name: 'Conveyance Allowance', displayNameBn: 'যাতায়াত ভাতা', type: 'EARNING', isDefault: true, category: 'ALLOWANCE', calculationType: 'flat', isStatutory: false },
    { name: 'Festival Bonus', displayNameBn: 'উৎসব ভাতা', type: 'EARNING', isDefault: true, category: 'ALLOWANCE', calculationType: 'flat', isStatutory: false },
    { name: 'Provident Fund', displayNameBn: 'প্রভিডেন্ট ফান্ড', type: 'DEDUCTION', isDefault: true, category: 'STATUTORY_DEDUCTION', calculationType: 'percentage_of_base', factor: 10, isStatutory: true },
    { name: 'Tax Deducted at Source', displayNameBn: 'উৎসে কর কর্তন', type: 'DEDUCTION', isDefault: true, category: 'STATUTORY_DEDUCTION', calculationType: 'flat', isStatutory: true },
  ];
  await prisma.salaryHead.createMany({ data: salaryHeads });

  // 4. Leave types (Bangladesh Labour Act 2006).
  const leaveTypes = [
    { name: 'Casual Leave', nameBn: 'ঐচ্ছিক ছুটি', category: 'Casual', defaultDays: 10, isPaid: true },
    { name: 'Earned Leave', nameBn: 'অর্জিত ছুটি', category: 'Earned', defaultDays: 14, isPaid: true },
    { name: 'Sick Leave', nameBn: 'অসুস্থতা ছুটি', category: 'Sick', defaultDays: 14, isPaid: true },
    { name: 'Festival Leave', nameBn: 'উৎসব ছুটি', category: 'Festival', defaultDays: 2, isPaid: true },
    { name: 'Maternity Leave', nameBn: 'মাতৃত্বকালীন ছুটি', category: 'Maternity', defaultDays: 112, isPaid: true, applicableGender: 'Female' },
    { name: 'Paternity Leave', nameBn: 'পিতৃত্বকালীন ছুটি', category: 'Paternity', defaultDays: 2, isPaid: true, applicableGender: 'Male' },
  ];
  await prisma.leaveType.createMany({ data: leaveTypes });

  // 5. Branch + external relations (C2).
  const branch = await prisma.branch.upsert({
    where: { name: 'Head Office — Dhaka' },
    update: {},
    create: { name: 'Head Office — Dhaka', city: 'Dhaka', address: 'Plot 1, Gulshan Avenue, Dhaka 1212', timezone: 'Asia/Dhaka' },
  });
  await prisma.branchRelations.createMany({
    data: [
      { branchId: branch.id, relationName: 'Bank', contactName: 'Sonali Bank', phone: '+880-2-123456', address: 'Gulshan Branch, Dhaka' },
      { branchId: branch.id, relationName: 'Labour Office', contactName: 'Department of Labour', address: 'Dhaka, Bangladesh' },
    ],
  });
  // Link owner to the branch.
  await prisma.user.update({ where: { id: owner.id }, data: { branchId: branch.id } });

  // 6. 2026 Bangladesh public holidays.
  await prisma.holiday.deleteMany();
  for (const h of holidays2026) {
    await prisma.holiday.create({
      data: { date: new Date(h.date), name: h.name, nameBn: h.nameBn, type: h.type },
    });
  }

  // 7. Benefits + an open enrollment period.
  await prisma.benefit.createMany({
    data: [
      { name: 'Health Insurance', description: 'Comprehensive medical cover', provider: 'Green Delta', category: 'Health' },
      { name: 'Provident Fund', description: 'Employer-matched retirement savings', provider: 'Internal', category: 'Retirement' },
      { name: 'Gym Membership', description: 'Monthly wellness stipend', provider: 'FitLife', category: 'Wellness' },
    ],
  });

  const now = new Date();
  const enrollmentEnd = new Date();
  enrollmentEnd.setMonth(enrollmentEnd.getMonth() + 1);
  await prisma.enrollmentPeriod.create({
    data: { name: 'Open Enrollment 2026', startDate: now, endDate: enrollmentEnd },
  });

  // 8. Default shift templates (incl. night shift for factory attendance).
  await prisma.shift.createMany({
    data: [
      { name: 'Standard Day', startTime: '09:00', endTime: '17:00', location: 'Office', graceMinutes: 10, isNightShift: false, breakMinutes: 60, branchId: branch.id },
      { name: 'Night Shift', startTime: '22:00', endTime: '06:00', location: 'Factory Floor', graceMinutes: 10, isNightShift: true, breakMinutes: 60, branchId: branch.id },
    ],
  });

  // 9. Payroll structure template (BD-aware heads).
  await prisma.salaryStructure.create({
    data: {
      name: 'Standard Salary (BD)',
      baseSalary: 50000,
      heads: JSON.stringify({
        'House Rent Allowance': 20000,
        'Medical Allowance': 1500,
        'Conveyance Allowance': 1000,
        'Festival Bonus': 50000,
        'Provident Fund': -5000,
        'Tax Deducted at Source': -3000,
      }),
    },
  });

  // 10. Training catalog (C3) — compliance training.
  await prisma.trainingCourse.createMany({
    data: [
      { title: 'Workplace Harassment Prevention', titleBn: 'কর্মক্ষেত্রে যৌন হয়রানি প্রতিরোধ', description: 'Mandatory annual compliance training', category: 'Compliance', durationHours: 2, isMandatory: true },
      { title: 'Fire Safety & Evacuation', titleBn: 'অগ্নি নিরাপত্তা ও উচ্ছেদ', category: 'Compliance', durationHours: 1, isMandatory: true },
      { title: 'Code of Conduct', titleBn: 'আচরণবিধি', category: 'Compliance', durationHours: 1, isMandatory: true },
    ],
  });

  // 11. Document templates (C5) — mail-merge EN/BN.
  await prisma.documentTemplate.createMany({
    data: [
      {
        slug: 'appointment-letter',
        name: 'Appointment Letter',
        nameBn: 'নিয়োগপত্র',
        category: 'Appointment',
        language: 'both',
        variables: JSON.stringify(['employeeName', 'designation', 'department', 'joinDate', 'salary', 'branchName', 'companyName']),
        body: 'This is to certify that {{employeeName}} has been appointed as {{designation}} in the {{department}} department of {{companyName}}, effective {{joinDate}}. Monthly gross salary: BDT {{salary}}. Reporting to the {{branchName}} branch.\n\nএতদ্বারা সনদিত হল যে {{employeeName}} কে {{companyName}} এর {{department}} বিভাগে {{designation}} পদে {{joinDate}} তারিখ থেকে নিয়োগ করা হয়েছে। মাসিক মোট বেতন: BDT {{salary}}।',
        version: 1,
      },
      {
        slug: 'experience-letter',
        name: 'Experience Letter',
        nameBn: 'অভিজ্ঞতার সনদ',
        category: 'Experience',
        language: 'both',
        variables: JSON.stringify(['employeeName', 'designation', 'joinDate', 'endDate', 'companyName']),
        body: 'This letter confirms that {{employeeName}} served as {{designation}} at {{companyName}} from {{joinDate}} to {{endDate}}. We appreciate their contributions.\n\nএই পত্রের মাধ্যমে নিশ্চিত করা যাচ্ছে যে {{employeeName}} {{joinDate}} থেকে {{endDate}} পর্যন্ত {{companyName}} এ {{designation}} হিসেবে কর্মরত ছিলেন।',
        version: 1,
      },
      {
        slug: 'noc',
        name: 'No Objection Certificate',
        nameBn: 'নো অবজেকশন সার্টিফিকেট',
        category: 'NOC',
        language: 'both',
        variables: JSON.stringify(['employeeName', 'designation', 'purpose', 'companyName']),
        body: 'This is to certify that {{companyName}} has no objection to {{employeeName}} ({{designation}}) pursuing: {{purpose}}.\n\nএতদ্বারা সনদিত হল যে {{companyName}} {{employeeName}} ({{designation}}) এর {{purpose}} গ্রহণে আপত্তিহীন।',
        version: 1,
      },
      {
        slug: 'increment-letter',
        name: 'Increment Letter',
        nameBn: 'বেতন বৃদ্ধির পত্র',
        category: 'Increment',
        language: 'both',
        variables: JSON.stringify(['employeeName', 'designation', 'oldSalary', 'newSalary', 'effectiveDate', 'companyName']),
        body: 'We are pleased to inform {{employeeName}} ({{designation}}) that, effective {{effectiveDate}}, your monthly gross salary is revised from BDT {{oldSalary}} to BDT {{newSalary}}.\n\n{{employeeName}} ({{designation}}) কে জানানো যাচ্ছে যে {{effectiveDate}} তারিখ থেকে আপনার মাসিক বেতন BDT {{oldSalary}} থেকে BDT {{newSalary}} এ উন্নীত করা হল।',
        version: 1,
      },
      {
        slug: 'offer-letter',
        name: 'Offer Letter',
        nameBn: 'চাকরির প্রস্তাব পত্র',
        category: 'Offer',
        language: 'both',
        variables: JSON.stringify(['candidateName', 'position', 'department', 'salary', 'joiningDate', 'companyName', 'location']),
        body: 'Dear {{candidateName}},\n\nWe are delighted to offer you the position of {{position}} in our {{department}} team at {{companyName}}, based at {{location}}. Your monthly gross salary will be BDT {{salary}}, with a joining date of {{joiningDate}}.\n\nজনাব {{candidateName}}, আমরা আনন্দের সাথে জানাচ্ছি যে আপনাকে {{companyName}} এর {{department}} বিভাগে {{position}} পদে নিয়োগ দেওয়া হয়েছে। আপনার মাসিক বেতন BDT {{salary}} এবং যোগদানের তারিখ {{joiningDate}}।',
        version: 1,
      },
    ],
  });

  // 12. Whistleblower ethics committee (C4).
  await prisma.committeeMember.createMany({
    data: [
      { name: 'Chairperson — Board nominee', role: 'Chair', isChair: true },
      { name: 'HR Representative', role: 'HR Representative' },
      { name: 'External Auditor', role: 'External Auditor' },
    ],
  });

  // 13. Engagement greeting rules (P10).
  await prisma.greetingRule.createMany({
    data: [
      { kind: 'birthday', channel: 'both', messageTemplate: '🎉 Happy Birthday, {name}! Wishing you a fantastic year ahead.' },
      { kind: 'anniversary', channel: 'both', messageTemplate: '🎊 Congratulations {name} on {years} year(s) with the company! Thank you for your dedication.' },
      { kind: 'festival', channel: 'inapp', messageTemplate: '🎈 Happy {holiday}! Enjoy the celebration with your loved ones.' },
    ],
  });

  console.log('✅ Seeding complete! Only the system owner exists; add real users via onboarding.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
