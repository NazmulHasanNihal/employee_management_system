"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Clock, FileText, Landmark, 
  Settings, ShieldCheck, MessageSquare, Bell, Megaphone, Calendar, 
  Network, ShieldAlert, Bitcoin, FileDigit, Radar, Lock,
  LogOut, Link as LinkIcon, GitBranch, LifeBuoy, UserCircle, Ghost,
  Menu, Search, ArrowRight, Home, Activity, Command, X, Hash, HardDriveDownload,
  Receipt, HeartPulse, UserPlus, CalendarRange,
  Laptop, BookOpen, Briefcase, TrendingUp, PieChart,
  BrainCircuit, Handshake, Calculator, Flame, Scale, Brain, Target, Map, Lightbulb,
  MessageCircle, Award, CheckSquare, ChevronDown, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/client';
import usePartySocket from '@/lib/usePartySocket';
import CommandPalette from './CommandPalette';
import { authClient } from '@/lib/auth-client';

export default function AppLayout({ children, user }: { children: React.ReactNode, user: { name: string, role: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOffline, setOffline, offlineQueue } = useAppStore();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const markRead = async (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  const markAllRead = () => setNotifications([]);
  const acknowledgePolicy = { isPending: false, mutate: (data: any) => {} };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const mandatoryPolicies: any[] = [];

  const socket = usePartySocket({
    host: 'localhost:1999',
    room: 'ems-global',
    onMessage(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'notification_update' || data.type === 'dm_update') {
        // notification update logic would go here
      }
    }
  });

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  const isContractor = (user as any)?.employmentType === 'Contract';

  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({
    'Core System': true,
    'Time & Attendance': true,
    'Talent & Culture': true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const navCategories = [
    {
      title: 'Core System',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'My Team', icon: Users, path: '/team' },
        { label: 'Profile', icon: UserCircle, path: '/profile' },
        { label: 'Messages', icon: MessageSquare, path: '/messages' },
        { label: 'Broadcasts', icon: Megaphone, path: '/announcements' },
        { label: 'Company Calendar', icon: Calendar, path: '/calendar' },
      ]
    },
    {
      title: 'Time & Attendance',
      items: [
        { label: 'Attendance', icon: Clock, path: '/attendance' },
        { label: 'Leave', icon: Calendar, path: '/leave' },
        { label: 'Shift Roster', icon: CalendarRange, path: '/shifts' },
      ]
    },
    {
      title: 'Finance & Assets',
      items: [
        { label: 'Payroll', icon: Bitcoin, path: '/payroll', hideForContractor: true },
        { label: 'Payroll Config', icon: Settings, path: '/payroll-settings', adminOnly: true },
        { label: 'Expenses', icon: Receipt, path: '/expenses' },
        { label: 'IT Assets', icon: Laptop, path: '/assets' },
      ]
    },
    {
      title: 'Talent & Culture',
      items: [
        { label: 'Performance', icon: Target, path: '/performance' },
        { label: 'Benefits', icon: Handshake, path: '/benefits', hideForContractor: true },
        { label: 'Kudos Board', icon: Award, path: '/recognition' },
        { label: 'Feedback Box', icon: MessageCircle, path: '/feedback' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Document Center', icon: FileText, path: '/documents' },
        { label: 'Applications', icon: FileText, path: '/applications' },
        { label: 'Compliance', icon: ShieldCheck, path: '/compliance' },
        { label: 'HR Helpdesk', icon: LifeBuoy, path: '/helpdesk' },
        { label: 'Workflows', icon: CheckSquare, path: '/onboarding', adminOnly: true },
      ]
    },
    {
      title: 'Admin Intelligence',
      items: [
        { label: 'Registry', icon: Users, path: '/registry' },
        { label: 'Recruitment', icon: Briefcase, path: '/recruitment', adminOnly: true },
        { label: 'Org Chart', icon: GitBranch, path: '/org-chart' },
        { label: 'Restructure Sandbox', icon: Network, path: '/hierarchy' },
        { label: 'DEI Auditor', icon: Scale, path: '/dei', adminOnly: true },
      ]
    },
    {
      title: 'System Security',
      items: [
        { label: 'Audit Log', icon: FileDigit, path: '/audit', adminOnly: true },
        { label: 'Config', icon: Settings, path: '/settings', adminOnly: true },
      ]
    }
  ];

  const flatNavItems = navCategories.flatMap(c => c.items);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col md:flex-row transition-colors duration-300`}>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <motion.aside 
        className={`fixed md:relative flex flex-col w-64 border-r ledger-border bg-[var(--bg-panel)] z-50 h-full transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 border-b ledger-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--bg-void)] border ledger-border flex items-center justify-center">
              <LinkIcon size={16} className="text-[var(--text-main)]" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-sm uppercase tracking-widest ledger-text">EMS.Core</h1>
              <p className="text-[9px] font-mono ledger-muted uppercase tracking-widest mt-0.5">Distributed Node</p>
            </div>
          </div>
          <button className="md:hidden text-[var(--text-muted)] hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          {navCategories.map((category) => {
            const filteredItems = category.items.filter(i => {
              if (i.adminOnly && user.role !== 'Admin' && user.role !== 'HR Manager') return false;
              if (i.hideForContractor && isContractor) return false;
              return true;
            });
            if (filteredItems.length === 0) return null;
            
            const isOpen = openCategories[category.title];
            
            return (
              <div key={category.title} className="mb-4">
                <button 
                  onClick={() => toggleCategory(category.title)}
                  className="w-full px-4 mb-2 flex items-center justify-between text-left group"
                >
                  <span className="text-[10px] font-mono ledger-muted uppercase tracking-widest group-hover:text-[var(--text-main)] transition-colors">{category.title}</span>
                  <motion.div
                    initial={false}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
                  </motion.div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.path;
                        return (
                          <button 
                            key={item.label}
                            onClick={() => router.push(item.path)} 
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-none border-l-4 transition-all duration-150 ${
                              active ? 'border-[var(--signal-amber)] bg-[var(--bg-hover)] text-[var(--signal-amber)]' : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] hover:pl-5'
                            }`}
                          >
                            <Icon size={16} className={active ? 'text-[var(--signal-amber)]' : 'text-[var(--text-muted)]'} />
                            <span className="font-mono text-xs uppercase tracking-wider font-semibold truncate">{item.label}</span>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t ledger-border">
          <div className="ledger-panel p-3 mb-4 group hover:border-[var(--signal-amber)] transition-colors cursor-pointer" onClick={() => router.push('/profile')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--bg-void)] border ledger-border flex items-center justify-center font-mono font-bold text-xs group-hover:text-[var(--signal-amber)] transition-colors">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs truncate ledger-text group-hover:text-white transition-colors">{user.name}</p>
                <p className="text-[9px] font-mono ledger-muted uppercase tracking-widest truncate">{user.role}</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 p-2 btn-secondary border-transparent hover:border-[var(--alert-red)] hover:text-[var(--alert-red)] transition-all">
            <LogOut size={14} />
            <span className="uppercase text-[10px] tracking-widest font-bold">Terminate Session</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden bg-[var(--bg-void)] relative">
        {isOffline && (
          <div className="bg-[var(--alert-red)] text-white p-2 text-xs font-mono flex items-center justify-between z-50 shadow-[0_0_10px_var(--alert-red)] relative">
            <div className="flex items-center gap-2">
              <Activity size={14} className="animate-pulse" />
              <span className="uppercase font-bold tracking-widest">System Offline (Drop-Dead Mode)</span>
              <span className="px-2 py-0.5 bg-black/30 rounded border border-white/20 hidden md:inline ml-2">
                {offlineQueue} operations queued locally
              </span>
            </div>
            <div className="flex items-center gap-4">
              {offlineQueue > 0 && (
                <button 
                  onClick={() => {
                    const data = JSON.stringify(offlineQueue, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `offline-ledger-backup-${Date.now()}.json`;
                    a.click();
                  }}
                  className="hidden md:flex items-center gap-1 hover:text-black hover:bg-white transition-colors bg-black/20 px-2 py-1 uppercase tracking-widest font-bold"
                  title="Export Offline Ledger to Disk"
                >
                  <HardDriveDownload size={12} />
                  <span>Export Ledger</span>
                </button>
              )}
              <span className="opacity-80 uppercase tracking-widest hidden sm:inline">Awaiting Uplink...</span>
            </div>
          </div>
        )}
        <header className="h-14 border-b ledger-border flex items-center justify-between px-4 md:px-8 bg-[var(--bg-panel)] shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-[var(--text-main)]">
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <LinkIcon size={16} className="text-[var(--text-main)]" />
                <span className="font-mono font-bold text-sm uppercase tracking-widest ledger-text">EMS.Core</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--alert-red)] rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-panel)] border ledger-border shadow-xl z-50">
                  <div className="p-3 border-b ledger-border flex justify-between items-center bg-[var(--bg-void)]">
                    <span className="text-[10px] font-mono ledger-muted uppercase tracking-widest">Alerts</span>
                    <button 
                      onClick={() => markAllRead()}
                      className="text-[10px] text-[var(--ledger-blue)] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications?.length === 0 ? (
                      <div className="p-4 text-center text-[10px] font-mono ledger-muted">No notifications</div>
                    ) : (
                      notifications?.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 border-b ledger-border text-sm flex justify-between items-start gap-2 ${!n.read ? 'bg-[var(--ledger-blue)]/5 border-l-2 border-l-[var(--ledger-blue)]' : ''}`}
                        >
                          <div className="flex-1">
                            <p className="ledger-text">{n.message}</p>
                            <p className="text-[9px] font-mono ledger-muted mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                          </div>
                          {!n.read && (
                            <button 
                              onClick={() => markRead(n.id)}
                              className="text-[10px] font-mono text-[var(--verify-green)] shrink-0 hover:underline"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[10px] font-mono ledger-muted uppercase tracking-widest group-hover:text-[var(--text-main)] transition-colors">Net.Status</span>
              <button 
                onClick={() => setOffline(!isOffline)}
                className={`w-8 h-4 rounded-full relative transition-colors ${isOffline ? 'bg-[var(--alert-red)]' : 'bg-[var(--verify-green)]'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-[var(--bg-panel)] transition-transform ${isOffline ? 'left-0.5' : 'left-4'}`} />
              </button>
            </label>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {mandatoryPolicies && mandatoryPolicies.length > 0 ? (
            <div className="absolute inset-0 bg-[var(--bg-void)] z-50 flex flex-col items-center justify-center p-4">
              <div className="ledger-panel p-8 max-w-2xl w-full bg-[var(--bg-panel)] border-[var(--alert-red)]/50 space-y-6">
                <div className="flex items-center gap-4 text-[var(--alert-red)] border-b border-[var(--alert-red)]/20 pb-4">
                  <ShieldAlert size={32} />
                  <div>
                    <h2 className="text-xl font-mono font-bold uppercase tracking-widest">Mandatory Policy Acknowledgment</h2>
                    <p className="text-xs font-mono opacity-80 mt-1">Access restricted until all pending policies are reviewed.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {mandatoryPolicies.map((policy: any) => (
                    <div key={policy.id} className="p-4 bg-black/40 border border-white/10 rounded-lg">
                      <h3 className="font-bold text-white mb-2 flex items-center justify-between">
                        {policy.title}
                        <button 
                          disabled={acknowledgePolicy.isPending}
                          onClick={() => acknowledgePolicy.mutate({ policyId: policy.id })}
                          className="bg-[var(--ledger-blue)] text-black px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                        >
                          I Acknowledge & Agree
                        </button>
                      </h3>
                      <div className="text-xs text-[var(--text-muted)] max-h-40 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                        {policy.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
