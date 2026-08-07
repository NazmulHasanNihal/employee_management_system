/**
 * seed-100-bd.ts
 *
 * Seeds 100 realistic Bangladeshi employees with a full corporate hierarchy,
 * avatar URLs, attendance, leave, payroll, tasks, and calendar events.
 *
 * Hierarchy:
 *   Level 0: CEO (system owner — already exists)
 *   Level 1: C-Suite (COO, CTO, CFO, CHRO) → report to CEO
 *   Level 2: Directors/VPs (~8) → report to C-Suite
 *   Level 3: Managers (~15) → report to Directors
 *   Level 4: Team Leads (~20) → report to Managers
 *   Level 5: Staff (~52) → report to Team Leads/Managers
 *
 * Run: pnpm tsx scripts/seed-100-bd.ts
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
const supabaseServiceKey = process.env['NEXT_SUPABASE_SERVICE_' + 'ROLE_KEY']!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Use DIRECT_URL (session mode) to avoid pgbouncer prepared-statement conflicts
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

// ─── Avatar helper ───
function avatar(name: string, bg = '6366f1'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=200&bold=true&format=png`;
}

// ─── Types ───
type SeedUser = {
  name: string;
  email: string;
  role: 'CEO' | 'Director' | 'Admin' | 'HR Manager' | 'Manager' | 'Employee';
  department: string;
  designation: string;
  branch: string;
  managerEmail?: string;
  gender: string;
  baseSalary: number;
  bloodGroup: string;
  religion: string;
  phone: string;
  city: string;
  avatarBg: string;
};

// ─── Branches ───
const BRANCHES = [
  { name: 'Dhaka HQ', city: 'Dhaka', address: 'Gulshan-2, Plot 15, Road 103, Dhaka 1212', timezone: 'Asia/Dhaka' },
  { name: 'Chittagong Office', city: 'Chittagong', address: 'Agrabad C/A, Chittagong 4100', timezone: 'Asia/Dhaka' },
  { name: 'Gazipur Plant', city: 'Gazipur', address: 'Konabari Industrial Area, Gazipur 1700', timezone: 'Asia/Dhaka' },
];

// ─── Departments ───
const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'Human Resources', 'Finance',
  'Operations', 'Product', 'Customer Support', 'Quality Control', 'Research & Development',
];

// ─── Blood groups & religions (weighted) ───
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RELIGIONS = ['Islam', 'Islam', 'Islam', 'Islam', 'Islam', 'Islam', 'Islam', 'Hinduism', 'Hinduism', 'Buddhism', 'Christianity'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── 100 employees data ───
const USERS: SeedUser[] = [
  // ═══════════════════════════════════════════════════════
  // LEVEL 1 — C-SUITE (4 people, report to CEO)
  // ═══════════════════════════════════════════════════════
  { name: 'Md. Rafiqul Islam', email: 'rafiqul.islam@opshub.bd', role: 'Director', department: 'Operations', designation: 'Chief Operating Officer (COO)', branch: 'Dhaka HQ', gender: 'Male', baseSalary: 380000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000001', city: 'Dhaka', avatarBg: 'f59e0b' },
  { name: 'Dr. Tahmina Akhter', email: 'tahmina.akhter@opshub.bd', role: 'Director', department: 'Engineering', designation: 'Chief Technology Officer (CTO)', branch: 'Dhaka HQ', gender: 'Female', baseSalary: 400000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000002', city: 'Dhaka', avatarBg: '8b5cf6' },
  { name: 'Md. Anwar Hossain', email: 'anwar.hossain@opshub.bd', role: 'Director', department: 'Finance', designation: 'Chief Financial Officer (CFO)', branch: 'Dhaka HQ', gender: 'Male', baseSalary: 370000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000003', city: 'Dhaka', avatarBg: '10b981' },
  { name: 'Fatema Begum', email: 'fatema.begum@opshub.bd', role: 'HR Manager', department: 'Human Resources', designation: 'Chief Human Resources Officer (CHRO)', branch: 'Dhaka HQ', gender: 'Female', baseSalary: 350000, bloodGroup: 'AB+', religion: 'Islam', phone: '+8801711000004', city: 'Dhaka', avatarBg: 'ec4899' },

  // ═══════════════════════════════════════════════════════
  // LEVEL 2 — DIRECTORS / VPs (8 people)
  // ═══════════════════════════════════════════════════════
  { name: 'Kamrul Hasan', email: 'kamrul.hasan@opshub.bd', role: 'Director', department: 'Engineering', designation: 'VP of Engineering', branch: 'Dhaka HQ', managerEmail: 'tahmina.akhter@opshub.bd', gender: 'Male', baseSalary: 280000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000005', city: 'Dhaka', avatarBg: '7c3aed' },
  { name: 'Sharmin Sultana', email: 'sharmin.sultana@opshub.bd', role: 'Director', department: 'Product', designation: 'VP of Product', branch: 'Dhaka HQ', managerEmail: 'tahmina.akhter@opshub.bd', gender: 'Female', baseSalary: 260000, bloodGroup: 'A-', religion: 'Islam', phone: '+8801711000006', city: 'Dhaka', avatarBg: '7c3aed' },
  { name: 'Md. Zahidul Haque', email: 'zahidul.haque@opshub.bd', role: 'Director', department: 'Sales', designation: 'Director of Sales', branch: 'Dhaka HQ', managerEmail: 'rafiqul.islam@opshub.bd', gender: 'Male', baseSalary: 250000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000007', city: 'Dhaka', avatarBg: '059669' },
  { name: 'Nusrat Jahan Nishi', email: 'nusrat.nishi@opshub.bd', role: 'Director', department: 'Marketing', designation: 'Director of Marketing', branch: 'Dhaka HQ', managerEmail: 'rafiqul.islam@opshub.bd', gender: 'Female', baseSalary: 240000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000008', city: 'Dhaka', avatarBg: '059669' },
  { name: 'Jamal Uddin Ahmed', email: 'jamal.uddin@opshub.bd', role: 'Director', department: 'Operations', designation: 'Director of Operations', branch: 'Chittagong Office', managerEmail: 'rafiqul.islam@opshub.bd', gender: 'Male', baseSalary: 230000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000009', city: 'Chittagong', avatarBg: '059669' },
  { name: 'Ruma Akter', email: 'ruma.akter@opshub.bd', role: 'Director', department: 'Human Resources', designation: 'Director of HR', branch: 'Dhaka HQ', managerEmail: 'fatema.begum@opshub.bd', gender: 'Female', baseSalary: 220000, bloodGroup: 'B-', religion: 'Islam', phone: '+8801711000010', city: 'Dhaka', avatarBg: 'db2777' },
  { name: 'Shafiqul Islam', email: 'shafiqul.islam@opshub.bd', role: 'Director', department: 'Finance', designation: 'Director of Finance', branch: 'Dhaka HQ', managerEmail: 'anwar.hossain@opshub.bd', gender: 'Male', baseSalary: 235000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000011', city: 'Dhaka', avatarBg: '0d9488' },
  { name: 'Syed Ashraful Haq', email: 'ashraful.haq@opshub.bd', role: 'Director', department: 'Quality Control', designation: 'Director of Quality', branch: 'Gazipur Plant', managerEmail: 'rafiqul.islam@opshub.bd', gender: 'Male', baseSalary: 225000, bloodGroup: 'AB-', religion: 'Islam', phone: '+8801711000012', city: 'Gazipur', avatarBg: '059669' },

  // ═══════════════════════════════════════════════════════
  // LEVEL 3 — MANAGERS (15 people)
  // ═══════════════════════════════════════════════════════
  // Engineering Managers (under VP Engineering)
  { name: 'Tanvir Ahmed Khan', email: 'tanvir.khan@opshub.bd', role: 'Manager', department: 'Engineering', designation: 'Engineering Manager - Backend', branch: 'Dhaka HQ', managerEmail: 'kamrul.hasan@opshub.bd', gender: 'Male', baseSalary: 180000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000013', city: 'Dhaka', avatarBg: '4f46e5' },
  { name: 'Ayesha Siddiqa', email: 'ayesha.siddiqa@opshub.bd', role: 'Manager', department: 'Engineering', designation: 'Engineering Manager - Frontend', branch: 'Dhaka HQ', managerEmail: 'kamrul.hasan@opshub.bd', gender: 'Female', baseSalary: 175000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000014', city: 'Dhaka', avatarBg: '4f46e5' },
  { name: 'Arif Chowdhury', email: 'arif.chowdhury@opshub.bd', role: 'Manager', department: 'Engineering', designation: 'Engineering Manager - DevOps', branch: 'Dhaka HQ', managerEmail: 'kamrul.hasan@opshub.bd', gender: 'Male', baseSalary: 185000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000015', city: 'Dhaka', avatarBg: '4f46e5' },
  // Product Manager (under VP Product)
  { name: 'Farhana Yesmin', email: 'farhana.yesmin@opshub.bd', role: 'Manager', department: 'Product', designation: 'Product Manager', branch: 'Dhaka HQ', managerEmail: 'sharmin.sultana@opshub.bd', gender: 'Female', baseSalary: 160000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000016', city: 'Dhaka', avatarBg: '4f46e5' },
  // R&D Manager (under VP Product)
  { name: 'Md. Saifur Rahman', email: 'saifur.rahman@opshub.bd', role: 'Manager', department: 'Research & Development', designation: 'R&D Manager', branch: 'Dhaka HQ', managerEmail: 'sharmin.sultana@opshub.bd', gender: 'Male', baseSalary: 170000, bloodGroup: 'B-', religion: 'Islam', phone: '+8801711000017', city: 'Dhaka', avatarBg: '4f46e5' },
  // Sales Managers (under Director of Sales)
  { name: 'Kamal Hossain Bhuiyan', email: 'kamal.bhuiyan@opshub.bd', role: 'Manager', department: 'Sales', designation: 'Regional Sales Manager - North', branch: 'Dhaka HQ', managerEmail: 'zahidul.haque@opshub.bd', gender: 'Male', baseSalary: 155000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000018', city: 'Dhaka', avatarBg: '4f46e5' },
  { name: 'Sumaiya Akter Moni', email: 'sumaiya.moni@opshub.bd', role: 'Manager', department: 'Sales', designation: 'Regional Sales Manager - South', branch: 'Chittagong Office', managerEmail: 'zahidul.haque@opshub.bd', gender: 'Female', baseSalary: 150000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000019', city: 'Chittagong', avatarBg: '4f46e5' },
  // Marketing Manager (under Director of Marketing)
  { name: 'Rezaul Karim', email: 'rezaul.karim@opshub.bd', role: 'Manager', department: 'Marketing', designation: 'Marketing Manager', branch: 'Dhaka HQ', managerEmail: 'nusrat.nishi@opshub.bd', gender: 'Male', baseSalary: 145000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000020', city: 'Dhaka', avatarBg: '4f46e5' },
  // Operations Managers (under Director of Operations)
  { name: 'Sirajul Islam', email: 'sirajul.islam@opshub.bd', role: 'Manager', department: 'Operations', designation: 'Factory Manager', branch: 'Gazipur Plant', managerEmail: 'jamal.uddin@opshub.bd', gender: 'Male', baseSalary: 160000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000021', city: 'Gazipur', avatarBg: '4f46e5' },
  { name: 'Liton Sarkar', email: 'liton.sarkar@opshub.bd', role: 'Manager', department: 'Operations', designation: 'Logistics Manager', branch: 'Chittagong Office', managerEmail: 'jamal.uddin@opshub.bd', gender: 'Male', baseSalary: 140000, bloodGroup: 'A+', religion: 'Hinduism', phone: '+8801711000022', city: 'Chittagong', avatarBg: '4f46e5' },
  // HR Managers (under Director of HR)
  { name: 'Nasima Khatun', email: 'nasima.khatun@opshub.bd', role: 'Manager', department: 'Human Resources', designation: 'HR Manager - Talent', branch: 'Dhaka HQ', managerEmail: 'ruma.akter@opshub.bd', gender: 'Female', baseSalary: 135000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000023', city: 'Dhaka', avatarBg: '4f46e5' },
  // Finance Manager (under Director of Finance)
  { name: 'Imran Hossain', email: 'imran.hossain@opshub.bd', role: 'Manager', department: 'Finance', designation: 'Finance Manager', branch: 'Dhaka HQ', managerEmail: 'shafiqul.islam@opshub.bd', gender: 'Male', baseSalary: 155000, bloodGroup: 'A-', religion: 'Islam', phone: '+8801711000024', city: 'Dhaka', avatarBg: '4f46e5' },
  // Customer Support Manager (under COO)
  { name: 'Rina Begum', email: 'rina.begum@opshub.bd', role: 'Manager', department: 'Customer Support', designation: 'Customer Support Manager', branch: 'Dhaka HQ', managerEmail: 'rafiqul.islam@opshub.bd', gender: 'Female', baseSalary: 130000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000025', city: 'Dhaka', avatarBg: '4f46e5' },
  // QC Manager (under Director of Quality)
  { name: 'Abdul Karim Howlader', email: 'abdul.karim@opshub.bd', role: 'Manager', department: 'Quality Control', designation: 'QC Manager', branch: 'Gazipur Plant', managerEmail: 'ashraful.haq@opshub.bd', gender: 'Male', baseSalary: 140000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000026', city: 'Gazipur', avatarBg: '4f46e5' },

  // ═══════════════════════════════════════════════════════
  // LEVEL 4 — TEAM LEADS (20 people)
  // ═══════════════════════════════════════════════════════
  // Backend Team Leads (under Tanvir Khan)
  { name: 'Rifat Islam', email: 'rifat.islam@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Senior Backend Lead', branch: 'Dhaka HQ', managerEmail: 'tanvir.khan@opshub.bd', gender: 'Male', baseSalary: 120000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000027', city: 'Dhaka', avatarBg: '3b82f6' },
  { name: 'Priya Das', email: 'priya.das@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Backend Team Lead', branch: 'Dhaka HQ', managerEmail: 'tanvir.khan@opshub.bd', gender: 'Female', baseSalary: 110000, bloodGroup: 'A+', religion: 'Hinduism', phone: '+8801711000028', city: 'Dhaka', avatarBg: '3b82f6' },
  // Frontend Team Leads (under Ayesha Siddiqa)
  { name: 'Sabbir Hossain', email: 'sabbir.hossain@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Frontend Team Lead', branch: 'Dhaka HQ', managerEmail: 'ayesha.siddiqa@opshub.bd', gender: 'Male', baseSalary: 115000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000029', city: 'Dhaka', avatarBg: '3b82f6' },
  { name: 'Mithila Rahman', email: 'mithila.rahman@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'UI/UX Team Lead', branch: 'Dhaka HQ', managerEmail: 'ayesha.siddiqa@opshub.bd', gender: 'Female', baseSalary: 105000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000030', city: 'Dhaka', avatarBg: '3b82f6' },
  // DevOps Team Lead (under Arif Chowdhury)
  { name: 'Masud Rana', email: 'masud.rana@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'DevOps Team Lead', branch: 'Dhaka HQ', managerEmail: 'arif.chowdhury@opshub.bd', gender: 'Male', baseSalary: 125000, bloodGroup: 'AB+', religion: 'Islam', phone: '+8801711000031', city: 'Dhaka', avatarBg: '3b82f6' },
  // Product Team Leads (under Farhana Yesmin)
  { name: 'Tasneem Afrin', email: 'tasneem.afrin@opshub.bd', role: 'Employee', department: 'Product', designation: 'Associate Product Manager', branch: 'Dhaka HQ', managerEmail: 'farhana.yesmin@opshub.bd', gender: 'Female', baseSalary: 95000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000032', city: 'Dhaka', avatarBg: '3b82f6' },
  // R&D Lead (under Saifur Rahman)
  { name: 'Jubayer Ahmed', email: 'jubayer.ahmed@opshub.bd', role: 'Employee', department: 'Research & Development', designation: 'R&D Lead', branch: 'Dhaka HQ', managerEmail: 'saifur.rahman@opshub.bd', gender: 'Male', baseSalary: 105000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000033', city: 'Dhaka', avatarBg: '3b82f6' },
  // Sales Team Leads
  { name: 'Biplob Chandra Das', email: 'biplob.das@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Senior Sales Lead', branch: 'Dhaka HQ', managerEmail: 'kamal.bhuiyan@opshub.bd', gender: 'Male', baseSalary: 90000, bloodGroup: 'O+', religion: 'Hinduism', phone: '+8801711000034', city: 'Dhaka', avatarBg: '3b82f6' },
  { name: 'Sultana Razia', email: 'sultana.razia@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Sales Team Lead', branch: 'Chittagong Office', managerEmail: 'sumaiya.moni@opshub.bd', gender: 'Female', baseSalary: 85000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000035', city: 'Chittagong', avatarBg: '3b82f6' },
  // Marketing Team Lead
  { name: 'Fahim Shahriar', email: 'fahim.shahriar@opshub.bd', role: 'Employee', department: 'Marketing', designation: 'Digital Marketing Lead', branch: 'Dhaka HQ', managerEmail: 'rezaul.karim@opshub.bd', gender: 'Male', baseSalary: 88000, bloodGroup: 'B-', religion: 'Islam', phone: '+8801711000036', city: 'Dhaka', avatarBg: '3b82f6' },
  // Operations Team Leads
  { name: 'Mokbul Hossain', email: 'mokbul.hossain@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Production Lead', branch: 'Gazipur Plant', managerEmail: 'sirajul.islam@opshub.bd', gender: 'Male', baseSalary: 75000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000037', city: 'Gazipur', avatarBg: '3b82f6' },
  { name: 'Rupom Saha', email: 'rupom.saha@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Warehouse Lead', branch: 'Chittagong Office', managerEmail: 'liton.sarkar@opshub.bd', gender: 'Male', baseSalary: 70000, bloodGroup: 'A+', religion: 'Hinduism', phone: '+8801711000038', city: 'Chittagong', avatarBg: '3b82f6' },
  // HR Team Lead
  { name: 'Tania Rahman', email: 'tania.rahman@opshub.bd', role: 'Employee', department: 'Human Resources', designation: 'Recruitment Lead', branch: 'Dhaka HQ', managerEmail: 'nasima.khatun@opshub.bd', gender: 'Female', baseSalary: 80000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000039', city: 'Dhaka', avatarBg: '3b82f6' },
  // Finance Team Lead
  { name: 'Habibur Rahman', email: 'habibur.rahman@opshub.bd', role: 'Employee', department: 'Finance', designation: 'Accounts Lead', branch: 'Dhaka HQ', managerEmail: 'imran.hossain@opshub.bd', gender: 'Male', baseSalary: 85000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000040', city: 'Dhaka', avatarBg: '3b82f6' },
  // Customer Support Team Lead
  { name: 'Salma Khatun', email: 'salma.khatun@opshub.bd', role: 'Employee', department: 'Customer Support', designation: 'Support Team Lead', branch: 'Dhaka HQ', managerEmail: 'rina.begum@opshub.bd', gender: 'Female', baseSalary: 72000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000041', city: 'Dhaka', avatarBg: '3b82f6' },
  // QC Team Leads
  { name: 'Nasir Uddin', email: 'nasir.uddin@opshub.bd', role: 'Employee', department: 'Quality Control', designation: 'QC Team Lead', branch: 'Gazipur Plant', managerEmail: 'abdul.karim@opshub.bd', gender: 'Male', baseSalary: 68000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000042', city: 'Gazipur', avatarBg: '3b82f6' },
  { name: 'Jesmin Akter', email: 'jesmin.akter@opshub.bd', role: 'Employee', department: 'Quality Control', designation: 'QC Inspection Lead', branch: 'Gazipur Plant', managerEmail: 'abdul.karim@opshub.bd', gender: 'Female', baseSalary: 65000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000043', city: 'Gazipur', avatarBg: '3b82f6' },

  // ═══════════════════════════════════════════════════════
  // LEVEL 5 — STAFF (53 people)
  // ═══════════════════════════════════════════════════════
  // Backend Engineers (under Rifat Islam & Priya Das)
  { name: 'Md. Sakib Al Hasan', email: 'sakib.hasan@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Senior Software Engineer', branch: 'Dhaka HQ', managerEmail: 'rifat.islam@opshub.bd', gender: 'Male', baseSalary: 95000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000044', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Nazmul Hassan', email: 'nazmul.hassan@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Software Engineer', branch: 'Dhaka HQ', managerEmail: 'rifat.islam@opshub.bd', gender: 'Male', baseSalary: 80000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000045', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Tamanna Sultana', email: 'tamanna.sultana@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Software Engineer', branch: 'Dhaka HQ', managerEmail: 'rifat.islam@opshub.bd', gender: 'Female', baseSalary: 78000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000046', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Rakibul Islam', email: 'rakibul.islam@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Junior Software Engineer', branch: 'Dhaka HQ', managerEmail: 'priya.das@opshub.bd', gender: 'Male', baseSalary: 55000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000047', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Sadia Afrin', email: 'sadia.afrin@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Junior Software Engineer', branch: 'Dhaka HQ', managerEmail: 'priya.das@opshub.bd', gender: 'Female', baseSalary: 50000, bloodGroup: 'A-', religion: 'Islam', phone: '+8801711000048', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Mehedi Hasan Rony', email: 'mehedi.rony@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Software Engineer', branch: 'Dhaka HQ', managerEmail: 'priya.das@opshub.bd', gender: 'Male', baseSalary: 72000, bloodGroup: 'B-', religion: 'Islam', phone: '+8801711000049', city: 'Dhaka', avatarBg: '64748b' },
  // Frontend Engineers (under Sabbir & Mithila)
  { name: 'Nusrat Jahan', email: 'nusrat.jahan@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Frontend Developer', branch: 'Dhaka HQ', managerEmail: 'sabbir.hossain@opshub.bd', gender: 'Female', baseSalary: 75000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000050', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Ashiqur Rahman', email: 'ashiqur.rahman@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Frontend Developer', branch: 'Dhaka HQ', managerEmail: 'sabbir.hossain@opshub.bd', gender: 'Male', baseSalary: 70000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000051', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Rabeya Khatun', email: 'rabeya.khatun@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'UI/UX Designer', branch: 'Dhaka HQ', managerEmail: 'mithila.rahman@opshub.bd', gender: 'Female', baseSalary: 68000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000052', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Jahidul Islam', email: 'jahidul.islam@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'UI Developer', branch: 'Dhaka HQ', managerEmail: 'mithila.rahman@opshub.bd', gender: 'Male', baseSalary: 62000, bloodGroup: 'AB+', religion: 'Islam', phone: '+8801711000053', city: 'Dhaka', avatarBg: '64748b' },
  // DevOps Engineers (under Masud Rana)
  { name: 'Farhan Tanvir', email: 'farhan.tanvir@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'DevOps Engineer', branch: 'Dhaka HQ', managerEmail: 'masud.rana@opshub.bd', gender: 'Male', baseSalary: 90000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000054', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Monira Begum', email: 'monira.begum@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'SRE Engineer', branch: 'Dhaka HQ', managerEmail: 'masud.rana@opshub.bd', gender: 'Female', baseSalary: 85000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000055', city: 'Dhaka', avatarBg: '64748b' },
  // Product Team (under Tasneem Afrin)
  { name: 'Shuvo Ahmed', email: 'shuvo.ahmed@opshub.bd', role: 'Employee', department: 'Product', designation: 'Product Analyst', branch: 'Dhaka HQ', managerEmail: 'tasneem.afrin@opshub.bd', gender: 'Male', baseSalary: 65000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000056', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Anika Tasnim', email: 'anika.tasnim@opshub.bd', role: 'Employee', department: 'Product', designation: 'Product Designer', branch: 'Dhaka HQ', managerEmail: 'tasneem.afrin@opshub.bd', gender: 'Female', baseSalary: 62000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000057', city: 'Dhaka', avatarBg: '64748b' },
  // R&D Team (under Jubayer Ahmed)
  { name: 'Mahfuzur Rahman', email: 'mahfuzur.rahman@opshub.bd', role: 'Employee', department: 'Research & Development', designation: 'Research Engineer', branch: 'Dhaka HQ', managerEmail: 'jubayer.ahmed@opshub.bd', gender: 'Male', baseSalary: 82000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000058', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Farzana Haque', email: 'farzana.haque@opshub.bd', role: 'Employee', department: 'Research & Development', designation: 'Data Scientist', branch: 'Dhaka HQ', managerEmail: 'jubayer.ahmed@opshub.bd', gender: 'Female', baseSalary: 88000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000059', city: 'Dhaka', avatarBg: '64748b' },
  // Sales Team (under Biplob & Sultana)
  { name: 'Shohag Mia', email: 'shohag.mia@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Sales Executive', branch: 'Dhaka HQ', managerEmail: 'biplob.das@opshub.bd', gender: 'Male', baseSalary: 55000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000060', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Rafia Sultana', email: 'rafia.sultana@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Sales Executive', branch: 'Dhaka HQ', managerEmail: 'biplob.das@opshub.bd', gender: 'Female', baseSalary: 52000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000061', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Milon Hossain', email: 'milon.hossain@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Sales Representative', branch: 'Dhaka HQ', managerEmail: 'biplob.das@opshub.bd', gender: 'Male', baseSalary: 45000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000062', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Moushumi Akter', email: 'moushumi.akter@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Sales Executive', branch: 'Chittagong Office', managerEmail: 'sultana.razia@opshub.bd', gender: 'Female', baseSalary: 50000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000063', city: 'Chittagong', avatarBg: '64748b' },
  { name: 'Shakil Ahmed', email: 'shakil.ahmed@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Sales Representative', branch: 'Chittagong Office', managerEmail: 'sultana.razia@opshub.bd', gender: 'Male', baseSalary: 42000, bloodGroup: 'A-', religion: 'Islam', phone: '+8801711000064', city: 'Chittagong', avatarBg: '64748b' },
  // Marketing Team (under Fahim)
  { name: 'Nazmun Nahar', email: 'nazmun.nahar@opshub.bd', role: 'Employee', department: 'Marketing', designation: 'Content Specialist', branch: 'Dhaka HQ', managerEmail: 'fahim.shahriar@opshub.bd', gender: 'Female', baseSalary: 55000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000065', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Tuhin Chowdhury', email: 'tuhin.chowdhury@opshub.bd', role: 'Employee', department: 'Marketing', designation: 'Social Media Manager', branch: 'Dhaka HQ', managerEmail: 'fahim.shahriar@opshub.bd', gender: 'Male', baseSalary: 52000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000066', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Israt Jahan', email: 'israt.jahan@opshub.bd', role: 'Employee', department: 'Marketing', designation: 'SEO Specialist', branch: 'Dhaka HQ', managerEmail: 'fahim.shahriar@opshub.bd', gender: 'Female', baseSalary: 48000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000067', city: 'Dhaka', avatarBg: '64748b' },
  // Operations / Factory (under Mokbul & Rupom)
  { name: 'Jakir Hossain', email: 'jakir.hossain@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Machine Operator', branch: 'Gazipur Plant', managerEmail: 'mokbul.hossain@opshub.bd', gender: 'Male', baseSalary: 35000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000068', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Rubel Mia', email: 'rubel.mia@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Machine Operator', branch: 'Gazipur Plant', managerEmail: 'mokbul.hossain@opshub.bd', gender: 'Male', baseSalary: 33000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000069', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Mosharraf Hossain', email: 'mosharraf.hossain@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Production Worker', branch: 'Gazipur Plant', managerEmail: 'mokbul.hossain@opshub.bd', gender: 'Male', baseSalary: 28000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000070', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Kohinoor Begum', email: 'kohinoor.begum@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Production Worker', branch: 'Gazipur Plant', managerEmail: 'mokbul.hossain@opshub.bd', gender: 'Female', baseSalary: 26000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000071', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Khabir Uddin', email: 'khabir.uddin@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Store Incharge', branch: 'Chittagong Office', managerEmail: 'rupom.saha@opshub.bd', gender: 'Male', baseSalary: 40000, bloodGroup: 'B-', religion: 'Islam', phone: '+8801711000072', city: 'Chittagong', avatarBg: '64748b' },
  { name: 'Pintu Roy', email: 'pintu.roy@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Logistics Assistant', branch: 'Chittagong Office', managerEmail: 'rupom.saha@opshub.bd', gender: 'Male', baseSalary: 32000, bloodGroup: 'A+', religion: 'Hinduism', phone: '+8801711000073', city: 'Chittagong', avatarBg: '64748b' },
  // HR Team (under Tania)
  { name: 'Shahanaz Parvin', email: 'shahanaz.parvin@opshub.bd', role: 'Employee', department: 'Human Resources', designation: 'HR Executive', branch: 'Dhaka HQ', managerEmail: 'tania.rahman@opshub.bd', gender: 'Female', baseSalary: 55000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000074', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Md. Riaz Uddin', email: 'riaz.uddin@opshub.bd', role: 'Employee', department: 'Human Resources', designation: 'Payroll Specialist', branch: 'Dhaka HQ', managerEmail: 'tania.rahman@opshub.bd', gender: 'Male', baseSalary: 52000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000075', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Rumana Islam', email: 'rumana.islam@opshub.bd', role: 'Employee', department: 'Human Resources', designation: 'Training Coordinator', branch: 'Dhaka HQ', managerEmail: 'tania.rahman@opshub.bd', gender: 'Female', baseSalary: 48000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000076', city: 'Dhaka', avatarBg: '64748b' },
  // Finance Team (under Habibur)
  { name: 'Mamun Hasan', email: 'mamun.hasan@opshub.bd', role: 'Employee', department: 'Finance', designation: 'Accountant', branch: 'Dhaka HQ', managerEmail: 'habibur.rahman@opshub.bd', gender: 'Male', baseSalary: 58000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000077', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Poly Akter', email: 'poly.akter@opshub.bd', role: 'Employee', department: 'Finance', designation: 'Accounts Assistant', branch: 'Dhaka HQ', managerEmail: 'habibur.rahman@opshub.bd', gender: 'Female', baseSalary: 42000, bloodGroup: 'A-', religion: 'Islam', phone: '+8801711000078', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Sumon Chakraborty', email: 'sumon.chakraborty@opshub.bd', role: 'Employee', department: 'Finance', designation: 'Tax Analyst', branch: 'Dhaka HQ', managerEmail: 'habibur.rahman@opshub.bd', gender: 'Male', baseSalary: 60000, bloodGroup: 'B+', religion: 'Hinduism', phone: '+8801711000079', city: 'Dhaka', avatarBg: '64748b' },
  // Customer Support Team (under Salma)
  { name: 'Shirin Sultana', email: 'shirin.sultana@opshub.bd', role: 'Employee', department: 'Customer Support', designation: 'Support Agent', branch: 'Dhaka HQ', managerEmail: 'salma.khatun@opshub.bd', gender: 'Female', baseSalary: 38000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000080', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Selim Reza', email: 'selim.reza@opshub.bd', role: 'Employee', department: 'Customer Support', designation: 'Support Agent', branch: 'Dhaka HQ', managerEmail: 'salma.khatun@opshub.bd', gender: 'Male', baseSalary: 35000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000081', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Hasina Begum', email: 'hasina.begum@opshub.bd', role: 'Employee', department: 'Customer Support', designation: 'Support Specialist', branch: 'Dhaka HQ', managerEmail: 'salma.khatun@opshub.bd', gender: 'Female', baseSalary: 40000, bloodGroup: 'B-', religion: 'Islam', phone: '+8801711000082', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Alamin Sheikh', email: 'alamin.sheikh@opshub.bd', role: 'Employee', department: 'Customer Support', designation: 'Support Agent', branch: 'Dhaka HQ', managerEmail: 'salma.khatun@opshub.bd', gender: 'Male', baseSalary: 34000, bloodGroup: 'O-', religion: 'Islam', phone: '+8801711000083', city: 'Dhaka', avatarBg: '64748b' },
  // QC Team (under Nasir & Jesmin)
  { name: 'Delwar Hossain', email: 'delwar.hossain@opshub.bd', role: 'Employee', department: 'Quality Control', designation: 'QC Inspector', branch: 'Gazipur Plant', managerEmail: 'nasir.uddin@opshub.bd', gender: 'Male', baseSalary: 38000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000084', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Morsheda Begum', email: 'morsheda.begum@opshub.bd', role: 'Employee', department: 'Quality Control', designation: 'QC Inspector', branch: 'Gazipur Plant', managerEmail: 'nasir.uddin@opshub.bd', gender: 'Female', baseSalary: 36000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000085', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Sokhina Begum', email: 'sokhina.begum@opshub.bd', role: 'Employee', department: 'Quality Control', designation: 'Lab Technician', branch: 'Gazipur Plant', managerEmail: 'jesmin.akter@opshub.bd', gender: 'Female', baseSalary: 32000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000086', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Faruk Ahmed', email: 'faruk.ahmed@opshub.bd', role: 'Employee', department: 'Quality Control', designation: 'Quality Analyst', branch: 'Gazipur Plant', managerEmail: 'jesmin.akter@opshub.bd', gender: 'Male', baseSalary: 40000, bloodGroup: 'AB+', religion: 'Islam', phone: '+8801711000087', city: 'Gazipur', avatarBg: '64748b' },
  // Additional Staff across departments
  { name: 'Raju Barua', email: 'raju.barua@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'QA Engineer', branch: 'Dhaka HQ', managerEmail: 'sabbir.hossain@opshub.bd', gender: 'Male', baseSalary: 65000, bloodGroup: 'O+', religion: 'Buddhism', phone: '+8801711000088', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Maliha Tabassum', email: 'maliha.tabassum@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'QA Engineer', branch: 'Dhaka HQ', managerEmail: 'ayesha.siddiqa@opshub.bd', gender: 'Female', baseSalary: 60000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000089', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Tariqul Islam', email: 'tariqul.islam@opshub.bd', role: 'Employee', department: 'Engineering', designation: 'Mobile Developer', branch: 'Dhaka HQ', managerEmail: 'ayesha.siddiqa@opshub.bd', gender: 'Male', baseSalary: 75000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000090', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Shaila Pervin', email: 'shaila.pervin@opshub.bd', role: 'Employee', department: 'Marketing', designation: 'Graphic Designer', branch: 'Dhaka HQ', managerEmail: 'rezaul.karim@opshub.bd', gender: 'Female', baseSalary: 45000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000091', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Jewel Rana', email: 'jewel.rana@opshub.bd', role: 'Employee', department: 'Sales', designation: 'Business Developer', branch: 'Dhaka HQ', managerEmail: 'kamal.bhuiyan@opshub.bd', gender: 'Male', baseSalary: 55000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000092', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Liza Akter', email: 'liza.akter@opshub.bd', role: 'Employee', department: 'Human Resources', designation: 'Admin Executive', branch: 'Dhaka HQ', managerEmail: 'nasima.khatun@opshub.bd', gender: 'Female', baseSalary: 40000, bloodGroup: 'B+', religion: 'Islam', phone: '+8801711000093', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Sujan Biswas', email: 'sujan.biswas@opshub.bd', role: 'Employee', department: 'Finance', designation: 'Audit Assistant', branch: 'Dhaka HQ', managerEmail: 'imran.hossain@opshub.bd', gender: 'Male', baseSalary: 42000, bloodGroup: 'O-', religion: 'Hinduism', phone: '+8801711000094', city: 'Dhaka', avatarBg: '64748b' },
  { name: 'Rahima Khatun', email: 'rahima.khatun@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Maintenance Helper', branch: 'Gazipur Plant', managerEmail: 'sirajul.islam@opshub.bd', gender: 'Female', baseSalary: 25000, bloodGroup: 'A+', religion: 'Islam', phone: '+8801711000095', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Emon Chandra Roy', email: 'emon.roy@opshub.bd', role: 'Employee', department: 'Operations', designation: 'Electrician', branch: 'Gazipur Plant', managerEmail: 'sirajul.islam@opshub.bd', gender: 'Male', baseSalary: 30000, bloodGroup: 'B+', religion: 'Hinduism', phone: '+8801711000096', city: 'Gazipur', avatarBg: '64748b' },
  { name: 'Taslima Nasreen', email: 'taslima.nasreen@opshub.bd', role: 'Employee', department: 'Customer Support', designation: 'Support Agent', branch: 'Dhaka HQ', managerEmail: 'rina.begum@opshub.bd', gender: 'Female', baseSalary: 36000, bloodGroup: 'O+', religion: 'Islam', phone: '+8801711000097', city: 'Dhaka', avatarBg: '64748b' },
];

// ─── Auth user creation helper ───
async function ensureAuthUser(email: string, name: string, role: string): Promise<string> {
  // Check if user already exists in Supabase Auth
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
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

// ─── Main ───
async function main() {
  console.log('🌱 Seeding 100 Bangladeshi employees…\n');

  // 1. Ensure branches exist
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

  // 2. Ensure departments exist
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: dept },
      update: {},
      create: { name: dept, budget: 5_000_000 },
    });
  }
  console.log(`✅ Departments: ${DEPARTMENTS.length} ensured`);

  // 3. Get the owner's ID
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    console.error('❌ Owner not found! Run prisma/seed.ts first.');
    process.exit(1);
  }

  // Update owner with avatar and proper hierarchy setup
  await prisma.user.update({
    where: { id: owner.id },
    data: {
      avatarUrl: avatar('Nazmul Admin', 'f59e0b'),
      branchId: branchIds['Dhaka HQ'],
    },
  });

  const idByEmail: Record<string, string> = {};
  idByEmail[OWNER_EMAIL] = owner.id;

  // 4. Create all 100 users
  let created = 0;
  for (const u of USERS) {
    if (u.email === OWNER_EMAIL) continue;
    try {
      const authId = await ensureAuthUser(u.email, u.name, u.role);
      const joinDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      const dbUser = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          role: u.role,
          department: u.department,
          designation: u.designation,
          branchId: branchIds[u.branch],
          gender: u.gender,
          baseSalary: u.baseSalary,
          bloodGroup: u.bloodGroup,
          religion: u.religion,
          phone: u.phone,
          city: u.city,
          country: 'Bangladesh',
          avatarUrl: avatar(u.name, u.avatarBg),
          preferredLanguage: 'bn',
          status: 'active',
          isOnboarded: true,
          employmentType: 'Full-Time',
          joinDate,
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
          bloodGroup: u.bloodGroup,
          religion: u.religion,
          phone: u.phone,
          city: u.city,
          country: 'Bangladesh',
          avatarUrl: avatar(u.name, u.avatarBg),
          preferredLanguage: 'bn',
          status: 'active',
          isOnboarded: true,
          employmentType: 'Full-Time',
          joinDate,
        },
      });
      idByEmail[u.email] = dbUser.id;
      created++;
      if (created % 10 === 0) console.log(`   …${created} users created`);
    } catch (err: any) {
      console.error(`⚠️  Failed to create ${u.name} (${u.email}): ${err.message}`);
    }
  }
  console.log(`✅ Users: ${created} employees created`);

  // 5. Wire managerId chains
  // C-Suite reports to CEO
  const cSuiteEmails = [
    'rafiqul.islam@opshub.bd',
    'tahmina.akhter@opshub.bd',
    'anwar.hossain@opshub.bd',
    'fatema.begum@opshub.bd',
  ];
  for (const email of cSuiteEmails) {
    if (idByEmail[email]) {
      await prisma.user.update({
        where: { id: idByEmail[email] },
        data: { managerId: owner.id },
      });
    }
  }

  // Everyone else with explicit managerEmail
  for (const u of USERS) {
    if (u.managerEmail && idByEmail[u.email] && idByEmail[u.managerEmail]) {
      await prisma.user.update({
        where: { id: idByEmail[u.email] },
        data: { managerId: idByEmail[u.managerEmail] },
      });
    }
  }
  console.log('✅ Manager chains wired (CEO → C-Suite → Directors → Managers → Leads → Staff)');

  // 6. Seed attendance for last 30 days (randomized for realism)
  console.log('📊 Seeding attendance records…');
  const allUserIds = Object.values(idByEmail);
  const attendanceData: any[] = [];
  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue; // Skip Fri-Sat (BD weekend)

    for (const uid of allUserIds) {
      if (Math.random() > 0.85) continue; // ~15% absence rate
      const clockInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
      const clockInMin = Math.floor(Math.random() * 60);
      const clockIn = new Date(date);
      clockIn.setHours(clockInHour, clockInMin, 0, 0);
      const clockOut = new Date(clockIn);
      clockOut.setHours(clockIn.getHours() + 8 + Math.floor(Math.random() * 2));

      const isLate = clockInHour >= 9 && clockInMin > 10;
      const workedMs = clockOut.getTime() - clockIn.getTime();
      const workedMinutes = Math.round(workedMs / 60000);

      attendanceData.push({
        userId: uid,
        date,
        clockIn,
        clockOut,
        status: isLate ? 'Late' : 'Present',
        workedMinutes,
        lateMinutes: isLate ? (clockInHour - 9) * 60 + clockInMin : 0,
      });
    }
  }
  const attendanceResult = await prisma.attendance.createMany({ data: attendanceData, skipDuplicates: true });
  console.log(`✅ Attendance: ${attendanceResult.count} records created`);

  // 7. Seed some leave requests
  console.log('🏖️  Seeding leave requests…');
  const leaveTypes = ['Casual Leave', 'Earned Leave', 'Sick Leave'];
  const leaveStatuses = ['Pending', 'Approved', 'Approved', 'Approved', 'Rejected'];
  let leaveCount = 0;
  for (const uid of allUserIds.slice(0, 60)) {
    const numLeaves = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numLeaves; i++) {
      const startDate = new Date(2026, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1);
      const days = Math.floor(Math.random() * 5) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);
      try {
        await prisma.leaveRequest.create({
          data: {
            userId: uid,
            type: pick(leaveTypes),
            startDate,
            endDate,
            days,
            details: pick(['Family event', 'Medical appointment', 'Personal work', 'Travel', 'Not feeling well', 'Religious obligation']),
            status: pick(leaveStatuses),
          },
        });
        leaveCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Leave requests: ${leaveCount} created`);

  // 8. Seed team tasks
  console.log('📋 Seeding team tasks…');
  const taskStatuses = ['ToDo', 'InProgress', 'InProgress', 'Done', 'Done', 'Done'];
  const taskTitles = [
    'Complete quarterly report', 'Update documentation', 'Fix production bug',
    'Design new feature mockup', 'Review pull requests', 'Prepare training material',
    'Client meeting follow-up', 'Inventory audit', 'Performance review prep',
    'Code refactoring sprint', 'Security audit checklist', 'Onboarding new hires',
    'Update SOP documents', 'Monthly KPI review', 'Budget proposal draft',
  ];
  let taskCount = 0;
  // Managers assign tasks to their reports
  for (const u of USERS) {
    if (['Manager', 'Director'].includes(u.role) && idByEmail[u.email]) {
      const reports = USERS.filter(r => r.managerEmail === u.email);
      for (const r of reports.slice(0, 3)) {
        if (!idByEmail[r.email]) continue;
        try {
          await prisma.teamTask.create({
            data: {
              title: pick(taskTitles),
              description: 'Auto-generated task for demo purposes.',
              status: pick(taskStatuses),
              priority: pick(['Low', 'Medium', 'High']),
              assigneeId: idByEmail[r.email],
              assignerId: idByEmail[u.email],
              dueDate: new Date(2026, 7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
            },
          });
          taskCount++;
        } catch { /* skip */ }
      }
    }
  }
  console.log(`✅ Team tasks: ${taskCount} created`);

  // 9. Seed calendar events
  console.log('📅 Seeding calendar events…');
  const eventTitles = [
    'All Hands Meeting', 'Sprint Planning', 'Team Standup',
    'Quarterly Review', 'Client Presentation', 'Training Session',
    'Department Meetup', 'Budget Review', 'Strategy Session',
  ];
  let eventCount = 0;
  for (let i = 0; i < 15; i++) {
    const creatorEmail = pick(USERS.filter(u => u.role !== 'Employee')).email;
    if (!idByEmail[creatorEmail]) continue;
    try {
      await prisma.calendarEvent.create({
        data: {
          title: pick(eventTitles),
          description: 'Scheduled event for the team.',
          type: pick(['Meeting', 'Reminder', 'Deadline']),
          date: new Date(2026, 7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1),
          creatorId: idByEmail[creatorEmail],
        },
      });
      eventCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Calendar events: ${eventCount} created`);

  // 10. Seed Assets
  console.log('💻 Seeding Assets…');
  const assetCategories = ['Laptop', 'Desktop', 'Smartphone', 'Monitor', 'Peripheral'];
  const brands = ['Apple', 'Dell', 'Lenovo', 'HP', 'Samsung', 'LG', 'Logitech'];
  let assetCount = 0;
  for (let i = 0; i < allUserIds.length; i++) {
    const uid = allUserIds[i];
    const cat = pick(assetCategories);
    const brand = pick(brands);
    const tag = `OPS-AST-2026-${(i + 1).toString().padStart(3, '0')}`;
    const name = cat === 'Laptop' ? `${brand} ThinkPad / MacBook` : `${brand} ${cat}`;
    try {
      await prisma.asset.create({
        data: {
          name,
          assetTag: tag,
          serialNumber: `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          category: cat,
          brand,
          condition: pick(['New', 'Excellent', 'Good']),
          location: pick(['Dhaka HQ', 'Chittagong Office', 'Gazipur Plant']),
          status: 'Active',
          purchasePrice: Math.floor(Math.random() * 120000) + 30000,
          purchaseDate: new Date(2025, 0, 15),
          assignedDate: new Date(2025, 1, 1),
          userId: uid,
        },
      });
      assetCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Assets: ${assetCount} created`);

  // 11. Seed Expenses
  console.log('💸 Seeding Expenses…');
  const expenseCategories = ['Travel', 'Conveyance', 'Client Entertainment', 'Office Supplies', 'Internet Stipend', 'Training & Courses'];
  const expenseStatuses = ['APPROVED', 'APPROVED', 'PENDING', 'REJECTED'];
  let expenseCount = 0;
  for (const uid of allUserIds.slice(0, 40)) {
    for (let k = 0; k < 2; k++) {
      try {
        await prisma.expense.create({
          data: {
            userId: uid,
            category: pick(expenseCategories),
            amount: Math.floor(Math.random() * 8000) + 500,
            description: pick(['Uber/CNG ride to client meeting', 'Monthly internet bill reimbursement', 'Client lunch meeting at Gulshan', 'Office desk organizer & notebooks', 'Technical course certification fee']),
            status: pick(expenseStatuses),
            isMileage: Math.random() > 0.7,
            createdAt: new Date(2026, 6, Math.floor(Math.random() * 28) + 1),
          },
        });
        expenseCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Expenses: ${expenseCount} created`);

  // 12. Seed Penalties
  console.log('⚠️  Seeding Penalties…');
  let penaltyCount = 0;
  for (const uid of allUserIds.slice(10, 25)) {
    try {
      await prisma.penalty.create({
        data: {
          userId: uid,
          amount: pick([500, 1000, 1500]),
          reason: pick(['Late attendance (>30 mins without notice)', 'Unannounced absence', 'Missing daily standup thrice']),
          status: pick(['UNPAID', 'PAID']),
          dueDate: new Date(2026, 7, 30),
        },
      });
      penaltyCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Penalties: ${penaltyCount} created`);

  // 13. Seed Payroll, Payments & PaymentRecords
  console.log('💰 Seeding Payrolls & Payment Records…');
  let payrollCount = 0;
  let paymentCount = 0;
  let paymentRecordCount = 0;

  const allUsersWithSalary = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, baseSalary: true, email: true }
  });

  for (let i = 0; i < allUsersWithSalary.length; i++) {
    const u = allUsersWithSalary[i];
    const base = u.baseSalary || 50000;
    const net = Math.round(base * 1.25); // approximate net pay

    try {
      const payroll = await prisma.payroll.create({
        data: {
          userId: u.id,
          month: 'July',
          year: 2026,
          status: 'PROCESSED',
          totalAmount: net,
          currency: 'BDT',
          earnings: Math.round(base * 1.4),
          deductions: Math.round(base * 0.15),
          earningsBreakdown: [
            { head: 'Basic Salary', amount: base },
            { head: 'House Rent Allowance', amount: Math.round(base * 0.4) },
            { head: 'Medical Allowance', amount: 1500 },
            { head: 'Conveyance Allowance', amount: 1000 },
          ],
          deductionsBreakdown: [
            { head: 'Provident Fund', amount: Math.round(base * 0.1) },
            { head: 'Tax Deducted at Source', amount: Math.round(base * 0.05) },
          ]
        }
      });
      payrollCount++;

      await prisma.payment.create({
        data: {
          payrollId: payroll.id,
          userId: u.id,
          month: 7,
          year: 2026,
          amount: net,
          method: pick(['BANK', 'BANK', 'BKASH', 'ROCKET']),
          reference: `TRX-BD-2026-${(i + 1001).toString()}`,
          status: 'PAID',
          details: `July 2026 Monthly Salary Disbursement for ${u.name}`,
        }
      });
      paymentCount++;

      await prisma.paymentRecord.create({
        data: {
          trxId: `TXN-BD-${(i + 5001).toString()}`,
          userId: u.id,
          disbursedById: owner.id,
          paymentType: 'SALARY',
          paymentMethod: i % 3 === 0 ? 'BKASH' : 'BANK_TRANSFER',
          batchType: 'BULK_BATCH',
          batchRef: 'BATCH-JULY-2026-01',
          bankName: i % 3 === 0 ? 'bKash Merchant' : pick(['Sonali Bank', 'Dutch-Bangla Bank', 'BRAC Bank', 'City Bank']),
          accountNumber: `2019${(i + 10000).toString()}`,
          branchName: 'Gulshan Branch, Dhaka',
          baseAmount: base,
          bonuses: 0,
          adjustments: 0,
          deductions: Math.round(base * 0.15),
          netPaidAmount: net,
          remarks: 'July 2026 Salary Processed via BEFTN/bKash Direct',
          status: 'DISBURSED',
        }
      });
      paymentRecordCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Payrolls (${payrollCount}), Payments (${paymentCount}), PaymentRecords (${paymentRecordCount}) created`);

  // 14. Seed Helpdesk Tickets & Replies
  console.log('🎫 Seeding Helpdesk Tickets & Replies…');
  const ticketSubjects = [
    'Laptop screen flickering issue',
    'VPN access request for remote work',
    'Payroll payslip discrepancy for July',
    'Monitor dual-display setup request',
    'ID card replacement request',
    'Software license key for JetBrains/Figma',
  ];
  let ticketCount = 0;
  for (let i = 0; i < 20; i++) {
    const uid = pick(allUserIds);
    try {
      const ticket = await prisma.ticket.create({
        data: {
          userId: uid,
          subject: pick(ticketSubjects),
          priority: pick(['Low', 'Medium', 'High', 'Critical']),
          status: pick(['Open', 'In Progress', 'Resolved']),
          createdAt: new Date(2026, 6, Math.floor(Math.random() * 20) + 1),
        }
      });
      ticketCount++;

      // Add a reply from IT / HR
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket.id,
          authorId: owner.id,
          content: 'Thank you for reaching out. Our IT support team is looking into this and will update you shortly.',
        }
      });
    } catch { /* skip */ }
  }
  console.log(`✅ Helpdesk Tickets: ${ticketCount} created with replies`);

  // 15. Seed Performance Reviews & Scores
  console.log('⭐ Seeding Performance Reviews…');
  const reviewRatings = ['Exceeds Expectations', 'Meets Expectations', 'Meets Expectations', 'Needs Improvement'];
  const dimensions = ['Communication', 'Leadership', 'Execution', 'Teamwork', 'Technical Competence'];
  let reviewCount = 0;
  for (const uid of allUserIds.slice(0, 30)) {
    const rating = pick(reviewRatings);
    try {
      const review = await prisma.review.create({
        data: {
          userId: uid,
          reviewerId: owner.id,
          reviewPeriod: 'Annual Review 2025-2026',
          rating,
          comments: rating === 'Exceeds Expectations'
            ? 'Outstanding performance across all assigned deliverables. Showed great leadership and ownership.'
            : 'Consistently meets project timelines and demonstrates strong collaboration with cross-functional teams.',
        }
      });
      reviewCount++;

      for (const dim of dimensions) {
        await prisma.reviewScore.create({
          data: {
            reviewId: review.id,
            dimension: dim,
            rating: rating === 'Exceeds Expectations' ? (4 + Math.random() * 1) : (3 + Math.random() * 1.5),
            reviewerId: owner.id,
            userId: uid,
          }
        });
      }
    } catch { /* skip */ }
  }
  console.log(`✅ Reviews: ${reviewCount} created with dimension scores`);

  // 16. Seed Festival Bonuses
  console.log('🌙 Seeding Festival Bonuses…');
  let bonusCount = 0;
  for (const uid of allUserIds.slice(0, 40)) {
    const u = USERS.find(x => idByEmail[x.email] === uid);
    const base = u ? u.baseSalary : 50000;
    try {
      await prisma.festivalBonus.create({
        data: {
          userId: uid,
          year: 2026,
          occasion: 'Eid-ul-Fitr',
          occasionBn: 'ঈদুল ফিতর',
          amount: base, // 100% of basic salary
          baseSalarySnapshot: base,
          status: 'PAID',
        }
      });
      bonusCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Festival Bonuses: ${bonusCount} created`);

  // 17. Seed Compensation Adjustments
  console.log('📈 Seeding Compensation Adjustments…');
  let compAdjCount = 0;
  for (const uid of allUserIds.slice(0, 15)) {
    const u = USERS.find(x => idByEmail[x.email] === uid);
    const oldSal = u ? u.baseSalary : 60000;
    const newSal = Math.round(oldSal * 1.15); // 15% increment
    try {
      await prisma.compensationAdjustment.create({
        data: {
          userId: uid,
          type: 'INCREMENT',
          oldSalary: oldSal,
          newSalary: newSal,
          delta: newSal - oldSal,
          percentage: 15.0,
          reason: 'Annual Performance Appraisal 2026',
          effectiveDate: new Date(2026, 6, 1),
          status: 'APPROVED',
          requestedById: owner.id,
          approvedById: owner.id,
        }
      });
      compAdjCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Compensation Adjustments: ${compAdjCount} created`);

  // 18. Seed Whistleblower Reports
  console.log('🛡️  Seeding Whistleblower Reports…');
  let wbCount = 0;
  for (let i = 0; i < 3; i++) {
    try {
      await prisma.whistleblowerReport.create({
        data: {
          report: pick([
            'Noticeable mismatch in factory overtime log verification at Gazipur Plant for shift B.',
            'Discrepancy observed in vendor procurement pricing for office laptops.',
            'Request for review regarding fair night-shift differential distribution.',
          ]),
          status: pick(['Received', 'Investigating', 'Resolved']),
          assignedTo: 'Chairperson — Board nominee',
          resolution: 'Ethics committee reviewed the logs and confirmed operational compliance.',
        }
      });
      wbCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ Whistleblower Reports: ${wbCount} created`);

  // 19. Seed Benefits & Benefit Enrollments
  console.log('🏥 Seeding Benefit Enrollments…');
  const benefitsList = await prisma.benefit.findMany();
  let enrollmentCount = 0;
  if (benefitsList.length > 0) {
    for (const uid of allUserIds.slice(0, 50)) {
      for (const b of benefitsList) {
        try {
          await prisma.benefitEnrollment.create({
            data: {
              userId: uid,
              benefitId: b.id,
              status: 'ENROLLED',
            }
          });
          enrollmentCount++;
        } catch { /* skip */ }
      }
    }
  }
  console.log(`✅ Benefit Enrollments: ${enrollmentCount} created`);

  console.log('\n🎉 Comprehensive seed complete!');
  console.log(`   Total employees: ${created + 1} (including CEO)`);
  console.log(`   Demo login password: ${DEMO_PASSWORD}`);
  console.log('   Hierarchy: CEO → C-Suite → Directors → Managers → Team Leads → Staff');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
