import { prisma } from "../src/lib/prisma";

const INITIAL_EMPLOYEES = [
  { email: 'sarah@example.com', name: 'Sarah Jenkins', role: 'Admin', department: 'Executive', designation: 'CEO', type: 'Permanent', level: 'Executive', status: 'Active', password: 'password123', salary: 150000, pulse: 'Manageable' },
  { email: 'nazmulhas36@gmail.com', name: 'Nazmul Admin', role: 'Admin', department: 'Engineering', designation: 'CTO', type: 'Permanent', level: 'Executive', status: 'Active', password: 'password123', salary: 140000, pulse: 'Heavy' },
  { email: 'musrat@example.com', name: 'Musrat', role: 'Manager', department: 'Product', designation: 'Product Manager', type: 'Contract', level: 'Mid-Level', status: 'Active', password: 'password123', salary: 90000, pulse: 'Overwhelmed' },
  { email: 'gungun@example.com', name: 'Gungun', role: 'Employee', department: 'Design', designation: 'UX Designer', type: 'Part-Time', level: 'Junior', status: 'Active', password: 'password123', salary: 45000, pulse: 'Manageable' },
];

async function main() {
  console.log("Seeding database...");

  // 1. Seed Users via HTTP to get Better Auth hashing
  const users: Record<string, string> = {}; // email -> id

  for (const emp of INITIAL_EMPLOYEES) {
    try {
      const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" },
        body: JSON.stringify({ email: emp.email, password: emp.password, name: emp.name })
      });
      const data = await res.json();
      
      if (res.status === 200 && data.user) {
        users[emp.email] = data.user.id;
      } else if (data.code === 'USER_ALREADY_EXISTS') {
        const u = await prisma.user.findUnique({ where: { email: emp.email } });
        if (u) users[emp.email] = u.id;
      }
      
      // Update custom fields using Prisma
      if (users[emp.email]) {
        await prisma.user.update({
          where: { id: users[emp.email] },
          data: {
            role: emp.role,
            department: emp.department,
            designation: emp.designation,
            employmentType: emp.type,
            level: emp.level,
            status: emp.status,
            salary: emp.salary,
            pulse: emp.pulse
          }
        });
      }
    } catch (err) {
      console.error("Error with user", emp.email, err);
    }
  }

  // Set Manager
  if (users['nazmulhas36@gmail.com'] && users['sarah@example.com']) {
    await prisma.user.update({ where: { id: users['nazmulhas36@gmail.com'] }, data: { managerId: users['sarah@example.com'] }});
  }
  if (users['musrat@example.com'] && users['sarah@example.com']) {
    await prisma.user.update({ where: { id: users['musrat@example.com'] }, data: { managerId: users['sarah@example.com'] }});
  }
  if (users['gungun@example.com'] && users['musrat@example.com']) {
    await prisma.user.update({ where: { id: users['gungun@example.com'] }, data: { managerId: users['musrat@example.com'] }});
  }

  const nazmulId = users['nazmulhas36@gmail.com'];
  const sarahId = users['sarah@example.com'];
  const musratId = users['musrat@example.com'];
  const gungunId = users['gungun@example.com'];

  // Clean old data to avoid duplicates on re-run
  await prisma.attendance.deleteMany();
  await prisma.application.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.auditLog.deleteMany();

  // 2. Announcements
  await prisma.announcement.createMany({
    data: [
      { title: 'Q4 Performance Reviews Initiated', content: 'All employees must submit their self-evaluations via the Performance tab by Nov 5th.', priority: 'High', author: 'Sarah Jenkins', readReceipts: 4 },
      { title: 'Server Maintenance Window', content: 'The EMS portal will be down for 2 hours on Sunday 02:00 AM UTC for database indexing.', priority: 'Medium', author: 'Nazmul', readReceipts: 142 },
    ]
  });

  // 3. Assets
  if (sarahId) await prisma.asset.create({ data: { name: 'MacBook Pro 16"', status: 'Good', userId: sarahId }});
  if (nazmulId) {
    await prisma.asset.create({ data: { name: 'MacBook Pro 16"', status: 'Good', userId: nazmulId }});
    await prisma.asset.create({ data: { name: 'YubiKey', status: 'Active', userId: nazmulId }});
  }
  if (musratId) await prisma.asset.create({ data: { name: 'ThinkPad X1', status: 'Repair Needed', userId: musratId }});
  if (gungunId) await prisma.asset.create({ data: { name: 'Wacom Tablet', status: 'Good', userId: gungunId }});

  // 5. Applications
  if (musratId) await prisma.application.create({ data: { userId: musratId, type: 'Leave Request', details: 'Sick Leave (2 Days)', status: 'Pending Manager' }});
  if (gungunId) await prisma.application.create({ data: { userId: gungunId, type: 'Expense Claim', details: 'Figma Software License ($15.00)', status: 'Pending Manager' }});

  // 6. Attendance (Today)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const in8 = new Date(today); in8.setHours(8, 58, 0, 0);
  const in9 = new Date(today); in9.setHours(9, 15, 0, 0);

  if (nazmulId) await prisma.attendance.create({ data: { userId: nazmulId, date: today, clockIn: in8, shift: 'Morning (09:00-17:00)', status: 'Present' }});
  if (musratId) await prisma.attendance.create({ data: { userId: musratId, date: today, clockIn: in9, shift: 'Morning (09:00-17:00)', status: 'Late', anomaly: 'IP Mismatch (Off-site)' }});
  if (gungunId) await prisma.attendance.create({ data: { userId: gungunId, date: today, shift: 'Evening (14:00-22:00)', status: 'Pending' }});

  // 7. Payroll
  if (nazmulId) {
    await prisma.payroll.create({ data: { userId: nazmulId, month: 'September 2026', baseSalary: 4500.00, net: 4350.00, breakdown: '{}', totalHours: 160, overtimeHours: 0, lateDays: 0, status: 'Disbursed' }});
  }

  // 10. Documents
  if (nazmulId) {
    await prisma.document.create({ data: { userId: nazmulId, name: 'Employment_Contract_2018.pdf', color: 'text-[var(--ledger-blue)]' }});
    await prisma.document.create({ data: { userId: nazmulId, name: 'NDA_Signed_2018.pdf', color: 'text-[var(--signal-amber)]' }});
  }
  if (sarahId) {
    await prisma.document.create({ data: { userId: sarahId, name: 'HR_Compliance_Cert.pdf', color: 'text-[var(--verify-green)]' }});
  }

  // 11. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { actor: 'SYSTEM', action: 'GENESIS_BLOCK', target: 'GLOBAL', prevHash: '00000000', hash: ' genesis' },
      { actor: 'SYSTEM', action: 'BOOTSTRAP', target: 'EMS.Core', prevHash: ' genesis', hash: '8a2f4c91' },
      { actor: 'Nazmul', action: 'ADMIN_LOGIN', target: 'AUTH', prevHash: '8a2f4c91', hash: '4b9f2d1e' },
    ]
  });

  console.log("Seeding complete!");
}

main().catch(console.error).finally(() => process.exit(0));
