import {
  LayoutDashboard, Users, Clock, FileText, Landmark,
  Settings, ShieldCheck, Bell, Megaphone, Calendar,
  Network, ShieldAlert, Bitcoin, FileDigit, Radar, Lock,
  LogOut, Link as LinkIcon, GitBranch, LifeBuoy, UserCircle, Ghost,
  Menu, Search, ArrowRight, Home, Activity, Command, X, Hash, HardDriveDownload,
  Receipt, HeartPulse, UserPlus, CalendarRange, Gift,
  Laptop, BookOpen, Briefcase, TrendingUp, PieChart,
  BrainCircuit, Handshake, Calculator, Flame, Scale, Brain, Target, Map, Lightbulb,
  MessageCircle, Award, CheckSquare, ChevronDown, ChevronRight, Sun, Moon, PenLine, Ban,
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  adminOnly?: boolean;
  hideForContractor?: boolean;
}

export interface NavCategory {
  title: string;
  items: NavItem[];
}

/**
 * Central navigation config. Kept in its own module so both the shell
 * (`Layout.tsx`) and the command palette (`CommandPalette.tsx`) can import it
 * without creating a circular dependency.
 */
export const navCategories: NavCategory[] = [
  {
    title: 'Core System',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'My Team', icon: Users, path: '/team' },
      { label: 'Company News', icon: Megaphone, path: '/announcements' },
      { label: 'Company Calendar', icon: Calendar, path: '/calendar' },
    ],
  },
  {
    title: 'Time & Attendance',
    items: [
      { label: 'Attendance', icon: Clock, path: '/attendance' },
      { label: 'Leave', icon: Calendar, path: '/leave' },
      { label: 'Shift Schedule', icon: CalendarRange, path: '/shifts' },
    ],
  },
  {
    title: 'Finance & Assets',
    items: [
      { label: 'Payroll', icon: Bitcoin, path: '/payroll', hideForContractor: true },
      { label: 'Festival Bonus', icon: Gift, path: '/festival-bonus', adminOnly: true, hideForContractor: true },
      { label: 'Payroll Config', icon: Settings, path: '/payroll-settings', adminOnly: true },
      { label: 'Expenses', icon: Receipt, path: '/expenses', adminOnly: true },
      { label: 'My Penalties', icon: Ban, path: '/penalties' },
      { label: 'IT Assets', icon: Laptop, path: '/assets' },
    ],
  },
  {
    title: 'Talent & Culture',
    items: [
      { label: 'Performance', icon: Target, path: '/performance' },
      { label: 'Engagement', icon: Gift, path: '/engagement' },
      { label: 'Benefits', icon: Handshake, path: '/benefits', hideForContractor: true },
      { label: 'Kudos Board', icon: Award, path: '/recognition' },
      { label: 'Feedback Box', icon: MessageCircle, path: '/feedback' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Document Vault', icon: FileText, path: '/documents' },
      { label: 'Requests & Approvals', icon: FileText, path: '/applications' },
      { label: 'Compliance', icon: ShieldCheck, path: '/compliance' },
      { label: 'HR Helpdesk', icon: LifeBuoy, path: '/helpdesk' },
      { label: 'Workflows', icon: CheckSquare, path: '/onboarding', adminOnly: true },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Employee Directory', icon: Users, path: '/registry' },
      { label: 'Whistleblower', icon: ShieldAlert, path: '/whistleblower', adminOnly: true },
      { label: 'Recruitment', icon: Briefcase, path: '/recruitment', adminOnly: true },
      { label: 'Org Chart', icon: GitBranch, path: '/org-chart' },
      { label: 'Organizational Structure', icon: Network, path: '/hierarchy' },
      { label: 'DEI Auditor', icon: Scale, path: '/dei', adminOnly: true },
    ],
  },
  {
    title: 'System Security',
    items: [
      { label: 'Audit Log', icon: FileDigit, path: '/audit', adminOnly: true },
      { label: 'Config', icon: Settings, path: '/settings', adminOnly: true },
    ],
  },
];
