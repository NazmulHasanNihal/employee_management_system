"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLinkStatus } from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import BottomSheet from '@/components/BottomSheet';
import {
  LayoutDashboard, Users, Clock, FileText, Landmark,
  Settings, ShieldCheck, Bell, Megaphone, Calendar,
  Network, ShieldAlert, Bitcoin, FileDigit, Radar, Lock,
  LogOut, Link as LinkIcon, GitBranch, LifeBuoy, UserCircle, Ghost,
  Menu, Search, ArrowRight, Home, Activity, Command, X, Hash, HardDriveDownload,
  Receipt, HeartPulse, UserPlus, CalendarRange, Gift,
  Laptop, BookOpen, Briefcase, TrendingUp, PieChart,
  BrainCircuit, Handshake, Calculator, Flame, Scale, Brain, Target, Map, Lightbulb,
  MessageCircle, Award, CheckSquare, ChevronDown, ChevronRight, Sun, Moon, PenLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '@/lib/store';
import CommandPalette from './CommandPalette';
import { ToastContainer } from './Toast';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/components/UserProvider';
import { useTranslation } from '@/lib/translations';
import { BranchSwitcher } from '@/components/BranchSwitcher';
import { Avatar } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc/client';
import { navCategories } from '@/components/nav-config';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { SkipLinks } from './SkipLinks';

interface LayoutUser {
  id: string;
  name: string;
  role: string;
  email?: string;
  department?: string;
  designation?: string;
  avatarUrl?: string | null;
  branchId?: string | null;
}

export { navCategories } from '@/components/nav-config';

/** Prefetching nav link — loads the next section before the click. */
function NavLink({ item, active, onClick, t }: { item: any; active: boolean; onClick?: () => void; t?: (key: string) => string }) {
  const Icon = item.icon;
  const status = useLinkStatus();
  return (
    <Link
      href={item.path}
      prefetch
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
        active
          ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
          : 'text-[var(--text-muted)] hover:-translate-y-px hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] hover:shadow-sm'
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="absolute left-0 h-5 w-1 rounded-full bg-[var(--brand)]"
        />
      )}
      <Icon size={17} className={`transition-colors duration-200 ${active ? 'text-[var(--brand-strong)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`} />
      <span className="truncate">{t?.(item.label) || item.label}</span>
      {status.pending && <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" />}
    </Link>
  );
}

export default function AppLayout({ children, user, notifications = [] }: { children: React.ReactNode; user: LayoutUser; notifications?: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isOffline, setOffline, offlineQueue, language, setLanguage } = useAppStore();
  const { user: ctxUser, isAdmin, isHR } = useUser();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);
  const t = useTranslation(language);

  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(showNotifications, notificationsRef as React.RefObject<HTMLElement>);
  useFocusTrap(showProfileMenu, profileRef as React.RefObject<HTMLElement>);

  React.useEffect(() => {
    if (!showNotifications && !showProfileMenu) return;
    const handlePointer = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showNotifications, showProfileMenu]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  React.useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Mark-read uses the existing trpc mutation for notifications (lightweight, infrequent).
  const markReadMutation = trpc.notifications.markRead.useMutation();
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation();
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const markRead = (id: string) => markReadMutation.mutate({ id });
  const markAllRead = () => {
    notifications.forEach((n: any) => { if (!n.read) markRead(n.id); });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isContractor = (user as any)?.employmentType === 'Contract';

  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({
    'Core System': true,
    'Time & Attendance': true,
    'Talent & Culture': true,
  });
  const toggleCategory = (cat: string) => setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  const canSee = (i: any) =>
    !(i.adminOnly && !isAdmin) &&
    !(i.hideForContractor && isContractor);

  return (
    <>
      <SkipLinks />
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--bg-app)] transition-colors duration-300 md:flex-row">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed z-50 flex h-full w-[85vw] max-w-[18rem] flex-col transform border-r border-[var(--border-hairline)] bg-[var(--bg-panel)] transition-transform duration-300 md:relative md:w-72 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
              <LinkIcon size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-[var(--text-main)]">OpsHub</h1>
              <p className="text-[10px] font-medium tracking-wide text-[var(--text-muted)]">Workspace</p>
            </div>
          </div>
          <button aria-label="Close menu" className="text-[var(--text-muted)] hover:text-[var(--text-main)] md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav id="primary-navigation" aria-label="Primary" className="custom-scrollbar flex-1 overflow-y-auto px-2 py-3 md:px-3 md:py-4">
          {navCategories.map((category) => {
            const filteredItems = category.items.filter(canSee);
            if (filteredItems.length === 0) return null;
            const isOpen = openCategories[category.title] ?? false;
            const categoryActive = filteredItems.some((i) => pathname === i.path);

            return (
              <div key={category.title} className="mb-2">
                <button
                  aria-expanded={isOpen}
                  onClick={() => toggleCategory(category.title)}
                  className="mb-1 flex w-full items-center justify-between px-3 text-left"
                >
                  <span className={`text-[11px] font-semibold uppercase tracking-wider transition-colors ${categoryActive ? 'text-[var(--brand-strong)]' : 'text-[var(--text-muted)]'}`}>
                    {t(category.title)}
                  </span>
                  <motion.div initial={false} animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="text-[var(--text-muted)]" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 flex flex-col gap-0.5">
                        {filteredItems.map((item) => (
                          <NavLink key={item.label} item={item} active={pathname === item.path} onClick={() => setIsMobileMenuOpen(false)} t={t} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-hairline)] p-3 md:p-4">
          <Link href="/profile" prefetch className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-hover)]">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-main)]">{user.name}</p>
              <p className="truncate text-[11px] text-[var(--text-muted)]">{user.designation || user.role}</p>
            </div>
          </Link>
        </div>
      </motion.aside>

       <main id="main-content" className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg-app)]">
         <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--bg-panel)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--text-main)] focus:shadow-lg">Skip to content</a>
         {isOffline && (
           <div role="status" aria-live="polite" className="relative z-50 flex items-center justify-between bg-[var(--rose)] px-3 py-1.5 text-xs font-medium text-white">
             <div className="flex items-center gap-2">
               <Activity size={14} className="animate-pulse" />
               <span>Offline — {offlineQueue} operations queued</span>
             </div>
             <span className="opacity-80">Awaiting connection…</span>
           </div>
         )}

         <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 md:px-6">
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 md:hidden">
               <button aria-label="Open menu" onClick={() => setIsMobileMenuOpen(true)} className="touch-target -ml-1 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]">
                 <Menu size={22} />
               </button>
             </div>
           </div>

           <div className="flex items-center gap-2 md:gap-3">
             <button
               aria-label="Open command palette"
               onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="hidden items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] sm:flex min-h-9"
             >
               <Command size={14} /> <span className="hidden sm:inline">⌘K</span>
             </button>

             <button
               aria-label="Toggle language"
               onClick={() => {
                 const next = language === 'en' ? 'bn' : 'en';
                 setLanguage(next);
                 document.cookie = `ems_lang=${next}; path=/; max-age=31536000; samesite=lax`;
                 router.refresh();
               }}
               className="touch-target flex items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] sm:px-3"
             >
               {language === 'en' ? 'ENG' : 'বাংলা'}
             </button>

             <BranchSwitcher lang={language} />

             <button aria-label="Toggle theme" onClick={toggleTheme} className="touch-target flex items-center justify-center rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
               {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             <div className="relative" ref={notificationsRef}>
               <button
                 aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                 aria-expanded={showNotifications}
                 onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                 className="touch-target relative flex items-center justify-center rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
               >
                 <Bell size={18} />
                 {unreadCount > 0 && (
                   <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--rose)] text-[8px] font-bold text-white">
                     {unreadCount > 9 ? '9+' : unreadCount}
                   </span>
                 )}
               </button>

              {showNotifications && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-lg">
                  <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-3">
                    <span className="text-xs font-semibold text-[var(--text-main)]">Alerts ({unreadCount})</span>
                    <button onClick={markAllRead} className="text-xs font-medium text-[var(--brand)] hover:underline">Mark all read</button>
                  </div>
                  <div className="custom-scrollbar max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-[var(--text-muted)]">No notifications</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => { if (n.link) router.push(n.link); if (!n.read) markRead(n.id); setShowNotifications(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { if (n.link) router.push(n.link); setShowNotifications(false); } }}
                          className={`cursor-pointer border-b border-[var(--border-hairline)] px-4 py-3 text-sm transition-colors hover:bg-[var(--bg-hover)] ${!n.read ? 'border-l-2 border-l-[var(--brand)] bg-[var(--brand-soft)]' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[var(--text-main)]">{n.message}</p>
                            {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" />}
                          </div>
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                aria-label="Profile menu"
                aria-expanded={showProfileMenu}
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-lg">
                  <div className="border-b border-[var(--border-hairline)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--text-main)]">{user.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                    <p className="mt-1 text-[11px] font-medium text-[var(--brand)]">{user.department} • {user.designation}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { router.push('/profile'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--bg-hover)]">
                      <UserCircle size={16} /> {t('My Profile')}
                    </button>
                    <button onClick={() => { router.push('/settings'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--bg-hover)]">
                      <Settings size={16} /> {t('Settings')}
                    </button>
                    <div className="my-1 border-t border-[var(--border-hairline)]" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--rose)] transition-colors hover:bg-[var(--rose-soft)]">
                      <LogOut size={16} /> {t('Sign Out')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-[var(--border-hairline)] bg-[var(--bg-panel)] px-0 safe-bottom md:hidden">
         {[
            { path: '/', icon: Home, label: 'Home' },
            { path: '/team', icon: Users, label: 'Team' },
            { path: '/attendance', icon: Clock, label: 'Time' },
            { path: '/leave', icon: Calendar, label: 'Leave' },
            { path: '/helpdesk', icon: LifeBuoy, label: 'Help' },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} prefetch aria-label={item.label} aria-current={active ? 'page' : undefined}
                className={`touch-target flex flex-1 flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                <Icon size={20} className="shrink-0" />
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
          <button aria-label="More routes" onClick={() => setIsBottomSheetOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5 text-[var(--text-muted)] transition-all active:scale-95 hover:text-[var(--text-main)]">
            <Menu size={20} className="shrink-0" />
            <span className="text-[9px] font-medium leading-tight">More</span>
          </button>
        </div>

      <BottomSheet open={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)}>
        <div className="grid grid-cols-2 gap-2">
          {navCategories.map((cat) => (
            <div key={cat.title} className="col-span-2 px-2 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t(cat.title)}</p>
            </div>
          ))}
          {navCategories.flatMap((cat) => cat.items).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch
                onClick={() => setIsBottomSheetOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                <Icon size={18} />
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </BottomSheet>

      <CommandPalette />
      <ToastContainer />
      <PwaInstallPrompt />
    </div>
    </>
  );
}
