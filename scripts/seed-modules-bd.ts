import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bangladeshi dummy data for modules...');

  // Fetch some active users to assign data to
  const users = await prisma.user.findMany({ take: 20 });
  if (users.length === 0) {
    console.error('No users found. Please run the main seed script first.');
    return;
  }

  const hrUser = users.find(u => u.department === 'HR' || u.department === 'Human Resources') || users[0];
  const adminUser = users.find(u => u.role === 'Admin') || users[0];

  // 1. Shift & Scheduling
  console.log('🕒 Creating Shifts...');
  await prisma.shift.deleteMany({}); // Reset
  const shifts = await Promise.all([
    prisma.shift.create({ data: { name: 'Morning Shift (BD)', startTime: '09:00', endTime: '17:00', recurringDays: [1,2,3,4,0] } }),
    prisma.shift.create({ data: { name: 'Evening Shift (BD)', startTime: '17:00', endTime: '01:00', recurringDays: [1,2,3,4,0] } }),
    prisma.shift.create({ data: { name: 'Night Shift (BD)', startTime: '01:00', endTime: '09:00', recurringDays: [1,2,3,4,0] } })
  ]);
  
  for (let i = 0; i < 5; i++) {
    await prisma.shiftAssignment.create({
      data: {
        userId: users[i].id,
        shiftId: shifts[i % shifts.length].id,
        date: new Date('2025-01-01'),
      }
    });
  }

  // 2. Penalties
  console.log('⚠️ Creating Penalties...');
  await prisma.penalty.deleteMany({});
  await prisma.penalty.createMany({
    data: [
      { userId: users[1].id, amount: 500, reason: 'Late arrival by 2 hours due to Dhaka traffic', status: 'PAID', dueDate: new Date('2025-08-01') },
      { userId: users[2].id, amount: 2000, reason: 'Violation of company internet policy', status: 'UNPAID', dueDate: new Date('2025-08-05') },
      { userId: users[3].id, amount: 1500, reason: 'Unexcused absence without prior notice', status: 'PAID', dueDate: new Date('2025-08-10') },
    ]
  });

  // 3. Secure Drop (WhistleblowerReports)
  console.log('🔒 Creating Secure Drop Reports...');
  await prisma.whistleblowerReport.deleteMany({});
  await prisma.whistleblowerReport.createMany({
    data: [
      { report: 'Inappropriate behavior reported in the Dhanmondi office breakroom.', status: 'Received', userId: users[1].id },
      { report: 'Discrepancies found in the recent vendor invoices for office supplies.', status: 'Investigating', userId: users[4].id },
      { report: 'Fire exit on the 3rd floor is consistently blocked by boxes.', status: 'Resolved', userId: users[2].id },
    ]
  });

  // 4. Document Vault
  console.log('📄 Creating Documents...');
  await prisma.document.deleteMany({});
  await prisma.document.createMany({
    data: [
      { ownerId: users[0].id, title: 'National_ID_Copy.pdf', type: 'Identity', url: 'https://example.com/nid.pdf', status: 'ACTIVE' },
      { ownerId: users[1].id, title: 'Tax_Certificate_2025.pdf', type: 'General', url: 'https://example.com/tax.pdf', status: 'PENDING' },
      { ownerId: users[2].id, title: 'Employee_Handbook_BD_v2.pdf', type: 'Policy', url: 'https://example.com/handbook.pdf', status: 'ACTIVE' },
      { ownerId: users[3].id, title: 'Academic_Transcript_BUET.pdf', type: 'General', url: 'https://example.com/transcript.pdf', status: 'ACTIVE' },
    ]
  });

  // 5. Governance (Certifications)
  console.log('📜 Creating Certifications...');
  await prisma.certification.deleteMany({});
  await prisma.certification.createMany({
    data: [
      { userId: users[0].id, name: 'ISO 27001 Information Security', expiryDate: new Date('2026-01-15') },
      { userId: users[1].id, name: 'Fire Safety & Hazard Training (BD)', expiryDate: new Date('2026-05-10') },
      { userId: users[2].id, name: 'First Aid Certification', expiryDate: new Date('2025-11-20') },
    ]
  });

  // 6. Support Center (Tickets)
  console.log('🎫 Creating Support Tickets...');
  await prisma.ticket.deleteMany({});
  await prisma.ticket.createMany({
    data: [
      { userId: users[1].id, subject: 'Laptop Screen Flickering', priority: 'High', status: 'Open' },
      { userId: users[2].id, subject: 'Request for Ergonomic Chair', priority: 'Medium', status: 'In Progress' },
      { userId: users[3].id, subject: 'Access denied to Staging Server', priority: 'Critical', status: 'Resolved' },
    ]
  });

  // 7. HR Workflows (OnboardingTasks, LeaveRequests)
  console.log('📋 Creating HR Workflows...');
  await prisma.onboardingTask.deleteMany({});
  await prisma.onboardingTask.createMany({
    data: [
      { title: 'Submit NID and Bank Details', isCompleted: false, category: 'Onboarding', userId: users[4].id, creatorId: hrUser.id },
      { title: 'Setup Workspace & Laptop', isCompleted: true, category: 'Onboarding', userId: users[5].id, creatorId: hrUser.id },
      { title: 'Meet with Manager', isCompleted: false, category: 'Onboarding', userId: users[6].id, creatorId: hrUser.id },
    ]
  });

  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveRequest.createMany({
    data: [
      { userId: users[1].id, type: 'CASUAL', startDate: new Date('2025-10-10'), endDate: new Date('2025-10-12'), days: 3, details: 'Durga Puja Holidays', status: 'Approved' },
      { userId: users[2].id, type: 'SICK', startDate: new Date('2025-08-01'), endDate: new Date('2025-08-02'), days: 2, details: 'Dengue Fever recovery', status: 'Approved' },
      { userId: users[3].id, type: 'ANNUAL', startDate: new Date('2025-12-14'), endDate: new Date('2025-12-18'), days: 5, details: 'Family trip to Coxs Bazar', status: 'Pending' },
    ]
  });

  // 8. Applicant Tracking System (ATS)
  console.log('👔 Creating ATS Data...');
  await prisma.candidate.deleteMany({});
  await prisma.jobRequisition.deleteMany({});
  
  const job1 = await prisma.jobRequisition.create({
    data: {
      title: 'Senior Frontend Engineer (React/Next.js)',
      department: 'Engineering',
      location: 'Dhaka, Bangladesh',
      type: 'Full-Time',
      status: 'Open',
      ownerId: hrUser.id,
    }
  });

  const job2 = await prisma.jobRequisition.create({
    data: {
      title: 'HR Business Partner',
      department: 'Human Resources',
      location: 'Dhaka, Bangladesh',
      type: 'Full-Time',
      status: 'Open',
      ownerId: hrUser.id,
    }
  });

  await prisma.candidate.createMany({
    data: [
      { jobId: job1.id, name: 'Rafiqul Islam', email: 'rafiqul.islam@example.bd', phone: '+8801711000001', status: 'Applied', resumeUrl: 'https://example.com/resume1.pdf', ownerId: hrUser.id },
      { jobId: job1.id, name: 'Sadia Rahman', email: 'sadia.rahman@example.bd', phone: '+8801811000002', status: 'Interviewing', resumeUrl: 'https://example.com/resume2.pdf', ownerId: hrUser.id },
      { jobId: job2.id, name: 'Kamrul Hasan', email: 'kamrul.hasan@example.bd', phone: '+8801911000003', status: 'Offered', resumeUrl: 'https://example.com/resume3.pdf', ownerId: hrUser.id },
    ]
  });

  console.log('✅ Bangladeshi Data Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
