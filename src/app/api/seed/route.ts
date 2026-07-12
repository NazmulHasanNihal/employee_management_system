import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INITIAL_EMPLOYEES = [
  { email: 'sarah@example.com', name: 'Sarah Jenkins', role: 'Admin', department: 'Executive', designation: 'CEO', type: 'Permanent', level: 'Executive', status: 'Active', password: 'password123', salary: 150000, pulse: 'Manageable' },
  { email: 'nazmulhas36@gmail.com', name: 'Nazmul Admin', role: 'Admin', department: 'Engineering', designation: 'CTO', type: 'Permanent', level: 'Executive', status: 'Active', password: 'password123', salary: 140000, pulse: 'Heavy' },
  { email: 'musrat@example.com', name: 'Musrat', role: 'Manager', department: 'Product', designation: 'Product Manager', type: 'Contract', level: 'Mid-Level', status: 'Active', password: 'password123', salary: 90000, pulse: 'Overwhelmed' },
  { email: 'gungun@example.com', name: 'Gungun', role: 'Employee', department: 'Design', designation: 'UX Designer', type: 'Part-Time', level: 'Junior', status: 'Active', password: 'password123', salary: 45000, pulse: 'Manageable' },
];

export async function GET(req: Request) {
  try {
    const users: Record<string, string> = {};

    for (const emp of INITIAL_EMPLOYEES) {
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

    return NextResponse.json({ success: true, seeded: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
