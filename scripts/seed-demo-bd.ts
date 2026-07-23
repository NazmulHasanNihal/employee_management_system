/**
 * seed-demo-bd.ts
 *
 * Creates a believable Bangladeshi organization so every page has data to show:
 *   - 3 branches (Dhaka HQ, Chittagong Factory, Gazipur Plant)
 *   - departments scoped to branches
 *   - managers + ~25 employees with correct managerId chains and branchId
 *   - BD public/govt holidays for 2026 (verify official dates before relying on them)
 *
 * Demo logins use password from DEMO_PASSWORD (default "Demo@1234"). Each user gets
 * a Supabase Auth account + a Prisma "User" row. Idempotent: safe to re-run.
 *
 * Run: pnpm tsx scripts/seed-demo-bd.ts
 *
 * NOTE: this only adds demo data. Use scripts/wipe-employees.ts to remove every
 * non-owner user for a clean reset.
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'nazmulhas36@gmail.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

type SeedUser = {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'HR Manager' | 'Employee' | 'Director';
  department: string;
  designation: string;
  branch: string;
  managerEmail?: string;
  gender: string;
  baseSalary: number;
  bloodGroup?: string;
  religion?: string;
  nid?: string;
};

const BRANCHES = [
  { name: 'Dhaka HQ', city: 'Dhaka', address: 'Banani, Dhaka-1213', timezone: 'Asia/Dhaka' },
  { name: 'Chittagong Factory', city: 'Chittagong', address: 'EPZ, Chittagong', timezone: 'Asia/Dhaka' },
  { name: 'Gazipur Plant', city: 'Gazipur', address: 'Konabari, Gazipur', timezone: 'Asia/Dhaka' },
];

const DEPARTMENTS = [
  { name: 'Engineering', branch: 'Dhaka HQ' },
  { name: 'Sales', branch: 'Dhaka HQ' },
  { name: 'Human Resources', branch: 'Dhaka HQ' },
  { name: 'Finance', branch: 'Dhaka HQ' },
  { name: 'Production', branch: 'Chittagong Factory' },
  { name: 'Quality Control', branch: 'Chittagong Factory' },
  { name: 'Operations', branch: 'Gazipur Plant' },
  { name: 'Maintenance', branch: 'Gazipur Plant' },
];

// Bangladesh public/govt holidays — single maintained dataset (2025–2027).
// Lunar dates are flagged tentative (moon-sighted / govt-to-confirm).
import { getBangladeshHolidays } from '../src/lib/bangladesh-holidays';

const USERS: SeedUser[] = [
  // Dhaka HQ leadership
  { name: 'Md. Rahman', email: 'rahman@emsdemo.bd', role: 'Director', department: 'Engineering', designation: 'CTO', branch: 'Dhaka HQ', gender: 'Male', baseSalary: 320000, bloodGroup: 'O+', religion: 'Islam', nid: '1234567890' },
  { name: 'Fatema Khatun', email: 'fatema@emsdemo.bd', role: 'HR Manager', department: 'Human Resources', designation: 'HR Lead', branch: 'Dhaka HQ', gender: 'Female', baseSalary: 180000, bloodGroup: 'A+', religion: 'Islam', nid: '2345678901' },
  { name: 'Kamal Hossain', email: 'kamal@emsdemo.bd', role: 'Manager', department: 'Sales', designation: 'Sales Manager', branch: 'Dhaka HQ', gender: 'Male', baseSalary: 200000, bloodGroup: 'B+', religion: 'Islam', nid: '3456789012' },
  { name: 'Ayesha Siddiqa', email: 'ayesha@emsdemo.bd', role: 'Manager', department: 'Finance', designation: 'Finance Manager', branch: 'Dhaka HQ', gender: 'Female', baseSalary: 210000, bloodGroup: 'AB+', religion: 'Islam', nid: '4567890123' },
  // Chittagong Factory leadership
  { name: 'Jamal Uddin', email: 'jamal@emsdemo.bd', role: 'Manager', department: 'Production', designation: 'Factory Manager', branch: 'Chittagong Factory', gender: 'Male', baseSalary: 190000, bloodGroup: 'O-', religion: 'Islam', nid: '5678901234' },
  { name: 'Rina Begum', email: 'rina@emsdemo.bd', role: 'Manager', department: 'Quality Control', designation: 'QC Manager', branch: 'Chittagong Factory', gender: 'Female', baseSalary: 160000, bloodGroup: 'A-', religion: 'Islam', nid: '6789012345' },
  // Gazipur Plant leadership
  { name: 'Siraj Mia', email: 'siraj@emsdemo.bd', role: 'Manager', department: 'Operations', designation: 'Plant Manager', branch: 'Gazipur Plant', gender: 'Male', baseSalary: 175000, bloodGroup: 'B-', religion: 'Islam', nid: '7890123456' },
  { name: 'Liton Sarkar', email: 'liton@emsdemo.bd', role: 'Manager', department: 'Maintenance', designation: 'Maintenance Head', branch: 'Gazipur Plant', gender: 'Male', baseSalary: 150000, bloodGroup: 'O+', religion: 'Hinduism', nid: '8901234567' },

  // Engineering reports (Dhaka HQ, manager: Rahman)
  { name: 'Tanvir Ahmed', email: 'tanvir@emsdemo.bd', role: 'Employee', department: 'Engineering', designation: 'Senior Engineer', branch: 'Dhaka HQ', managerEmail: 'rahman@emsdemo.bd', gender: 'Male', baseSalary: 120000, bloodGroup: 'A+', religion: 'Islam' },
  { name: 'Nusrat Jahan', email: 'nusrat@emsdemo.bd', role: 'Employee', department: 'Engineering', designation: 'Software Engineer', branch: 'Dhaka HQ', managerEmail: 'rahman@emsdemo.bd', gender: 'Female', baseSalary: 95000, bloodGroup: 'B+', religion: 'Islam' },
  { name: 'Arif Chowdhury', email: 'arif@emsdemo.bd', role: 'Employee', department: 'Engineering', designation: 'QA Engineer', branch: 'Dhaka HQ', managerEmail: 'rahman@emsdemo.bd', gender: 'Male', baseSalary: 90000, bloodGroup: 'O+', religion: 'Islam' },
  { name: 'Rifat Islam', email: 'rifat@emsdemo.bd', role: 'Employee', department: 'Engineering', designation: 'DevOps Engineer', branch: 'Dhaka HQ', managerEmail: 'rahman@emsdemo.bd', gender: 'Male', baseSalary: 110000, bloodGroup: 'AB+', religion: 'Islam' },

  // Sales reports (Dhaka HQ, manager: Kamal)
  { name: 'Sumaiya Akter', email: 'sumaiya@emsdemo.bd', role: 'Employee', department: 'Sales', designation: 'Sales Executive', branch: 'Dhaka HQ', managerEmail: 'kamal@emsdemo.bd', gender: 'Female', baseSalary: 70000, bloodGroup: 'O+', religion: 'Islam' },
  { name: 'Biplob Das', email: 'biplob@emsdemo.bd', role: 'Employee', department: 'Sales', designation: 'Sales Executive', branch: 'Dhaka HQ', managerEmail: 'kamal@emsdemo.bd', gender: 'Male', baseSalary: 65000, bloodGroup: 'B+', religion: 'Hinduism' },
  { name: 'Farhana Yesmin', email: 'farhana@emsdemo.bd', role: 'Employee', department: 'Sales', designation: 'Sales Lead', branch: 'Dhaka HQ', managerEmail: 'kamal@emsdemo.bd', gender: 'Female', baseSalary: 85000, bloodGroup: 'A+', religion: 'Islam' },

  // HR / Finance reports (Dhaka HQ)
  { name: 'Sharmin Sultana', email: 'sharmin@emsdemo.bd', role: 'Employee', department: 'Human Resources', designation: 'HR Executive', branch: 'Dhaka HQ', managerEmail: 'fatema@emsdemo.bd', gender: 'Female', baseSalary: 60000, bloodGroup: 'O-', religion: 'Islam' },
  { name: 'Imran Hossain', email: 'imran@emsdemo.bd', role: 'Employee', department: 'Finance', designation: 'Accountant', branch: 'Dhaka HQ', managerEmail: 'ayesha@emsdemo.bd', gender: 'Male', baseSalary: 75000, bloodGroup: 'A+', religion: 'Islam' },
  { name: 'Tania Rahman', email: 'tania@emsdemo.bd', role: 'Employee', department: 'Finance', designation: 'Accounts Assistant', branch: 'Dhaka HQ', managerEmail: 'ayesha@emsdemo.bd', gender: 'Female', baseSalary: 55000, bloodGroup: 'B+', religion: 'Islam' },

  // Production reports (Chittagong, manager: Jamal)
  { name: 'Abdul Karim', email: 'karim@emsdemo.bd', role: 'Employee', department: 'Production', designation: 'Line Supervisor', branch: 'Chittagong Factory', managerEmail: 'jamal@emsdemo.bd', gender: 'Male', baseSalary: 50000, bloodGroup: 'O+', religion: 'Islam' },
  { name: 'Mosharraf Hossain', email: 'mosharraf@emsdemo.bd', role: 'Employee', department: 'Production', designation: 'Machine Operator', branch: 'Chittagong Factory', managerEmail: 'jamal@emsdemo.bd', gender: 'Male', baseSalary: 38000, bloodGroup: 'A+', religion: 'Islam' },
  { name: 'Jakir Hossain', email: 'jakir@emsdemo.bd', role: 'Employee', department: 'Production', designation: 'Machine Operator', branch: 'Chittagong Factory', managerEmail: 'jamal@emsdemo.bd', gender: 'Male', baseSalary: 38000, bloodGroup: 'B+', religion: 'Islam' },
  { name: 'Rubel Mia', email: 'rubel@emsdemo.bd', role: 'Employee', department: 'Production', designation: 'Helper', branch: 'Chittagong Factory', managerEmail: 'jamal@emsdemo.bd', gender: 'Male', baseSalary: 32000, bloodGroup: 'O+', religion: 'Islam' },

  // QC reports (Chittagong, manager: Rina)
  { name: 'Salma Khatun', email: 'salma@emsdemo.bd', role: 'Employee', department: 'Quality Control', designation: 'QC Inspector', branch: 'Chittagong Factory', managerEmail: 'rina@emsdemo.bd', gender: 'Female', baseSalary: 42000, bloodGroup: 'A+', religion: 'Islam' },
  { name: 'Nasir Uddin', email: 'nasir@emsdemo.bd', role: 'Employee', department: 'Quality Control', designation: 'QC Inspector', branch: 'Chittagong Factory', managerEmail: 'rina@emsdemo.bd', gender: 'Male', baseSalary: 40000, bloodGroup: 'O-', religion: 'Islam' },

  // Operations reports (Gazipur, manager: Siraj)
  { name: 'Mokbul Hossain', email: 'mokbul@emsdemo.bd', role: 'Employee', department: 'Operations', designation: 'Store Incharge', branch: 'Gazipur Plant', managerEmail: 'siraj@emsdemo.bd', gender: 'Male', baseSalary: 48000, bloodGroup: 'B+', religion: 'Islam' },
  { name: 'Rupom Saha', email: 'rupom@emsdemo.bd', role: 'Employee', department: 'Operations', designation: 'Logistics Officer', branch: 'Gazipur Plant', managerEmail: 'siraj@emsdemo.bd', gender: 'Male', baseSalary: 45000, bloodGroup: 'A+', religion: 'Hinduism' },

  // Maintenance reports (Gazipur, manager: Liton)
  { name: 'Khabir Uddin', email: 'khabir@emsdemo.bd', role: 'Employee', department: 'Maintenance', designation: 'Technician', branch: 'Gazipur Plant', managerEmail: 'liton@emsdemo.bd', gender: 'Male', baseSalary: 40000, bloodGroup: 'O+', religion: 'Islam' },
  { name: 'Pintu Roy', email: 'pintu@emsdemo.bd', role: 'Employee', department: 'Maintenance', designation: 'Helper', branch: 'Gazipur Plant', managerEmail: 'liton@emsdemo.bd', gender: 'Male', baseSalary: 30000, bloodGroup: 'B+', religion: 'Hinduism' },
  { name: 'Sokhina Begum', email: 'sokhina@emsdemo.bd', role: 'Employee', department: 'Maintenance', designation: 'Cleaner', branch: 'Gazipur Plant', managerEmail: 'liton@emsdemo.bd', gender: 'Female', baseSalary: 28000, bloodGroup: 'A+', religion: 'Islam' },
];

async function ensureAuthUser(email: string, name: string, role: string): Promise<string> {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const found = (existing.users || []).find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) throw new Error(`Auth create failed for ${email}: ${error.message}`);
  return data.user!.id;
}

async function main() {
  console.log('🌱 Seeding Bangladeshi demo organization…\n');

  // Branches
  const branchIds: Record<string, string> = {};
  for (const b of BRANCHES) {
    const row = await prisma.branch.upsert({
      where: { name: b.name },
      update: b,
      create: b,
    });
    branchIds[b.name] = row.id;
  }
  console.log(`✅ Branches: ${Object.keys(branchIds).join(', ')}`);

  // Departments (branch-scoped)
  const deptIds: Record<string, string> = {};
  for (const d of DEPARTMENTS) {
    const row = await prisma.department.upsert({
      where: { name: d.name },
      update: { branchId: branchIds[d.branch] },
      create: { name: d.name, branchId: branchIds[d.branch], budget: 5_000_000 },
    });
    deptIds[d.name] = row.id;
  }
  console.log(`✅ Departments: ${DEPARTMENTS.length} created`);

  // Users (skip the owner — keep existing)
  const idByEmail: Record<string, string> = {};
  for (const u of USERS) {
    if (u.email === OWNER_EMAIL) continue;
    const authId = await ensureAuthUser(u.email, u.name, u.role);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.department,
        designation: u.designation,
        branchId: branchIds[u.branch],
        gender: u.gender,
        baseSalary: u.baseSalary,
        bloodGroup: u.bloodGroup ?? null,
        religion: u.religion ?? null,
        nid: u.nid ?? null,
        preferredLanguage: 'bn',
        status: 'active',
        isOnboarded: true,
        employmentType: 'Full-Time',
        city: BRANCHES.find((b) => b.name === u.branch)?.city ?? 'Dhaka',
        country: 'Bangladesh',
      },
      create: {
        id: authId,
        email: u.email,
        name: u.name,
        role: u.role,
        department: u.department,
        designation: u.designation,
        branchId: branchIds[u.branch],
        gender: u.gender,
        baseSalary: u.baseSalary,
        bloodGroup: u.bloodGroup ?? null,
        religion: u.religion ?? null,
        nid: u.nid ?? null,
        preferredLanguage: 'bn',
        status: 'active',
        isOnboarded: true,
        employmentType: 'Full-Time',
        city: BRANCHES.find((b) => b.name === u.branch)?.city ?? 'Dhaka',
        country: 'Bangladesh',
      },
    });
    idByEmail[u.email] = created.id;
  }

  // Wire managerId chains
  for (const u of USERS) {
    if (u.managerEmail && idByEmail[u.email] && idByEmail[u.managerEmail]) {
      await prisma.user.update({
        where: { email: u.email },
        data: { managerId: idByEmail[u.managerEmail] },
      });
    }
  }
  console.log(`✅ Users: ${USERS.length} demo users created (manager chains wired)`);

  // Holidays (from the shared maintained BD dataset; idempotent upsert by date).
  let holidayCount = 0;
  for (const h of getBangladeshHolidays()) {
    const date = new Date(h.date + 'T00:00:00Z');
    const existing = await prisma.holiday.findUnique({ where: { date } });
    if (!existing) {
      await prisma.holiday.create({ data: { date, name: h.name, nameBn: h.nameBn, type: h.type, category: h.category, isOptional: h.isOptional ?? false, year: h.year } });
      holidayCount++;
    }
  }
  console.log(`✅ Holidays: ${holidayCount} new BD holidays seeded (verify official dates)`);

  console.log('\n✅ Demo seed complete.');
  console.log(`   Demo login password: ${DEMO_PASSWORD}`);
  console.log('   Example logins: rahman@emsdemo.bd (Director), fatema@emsdemo.bd (HR), tanvir@emsdemo.bd (Employee)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
