"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  User as UserIcon,
  CalendarDays,
  HardDrive,
  MapPin,
  Clock,
  PhoneCall,
  Mail,
  MessageSquare,
  ShieldCheck,
  Banknote,
  Briefcase,
  FileText,
  ChevronRight,
  Hash,
  Building2,
  Terminal,
  Shield,
  Camera,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';

export default function ProfilePage() {
  const { data: session, isLoading: sessionLoading } = authClient.useSession();
  const user = session?.user as any;

  const { language } = useAppStore();
  const t = useTranslation(language);

  const { data: documents, isLoading: docsLoading } = trpc.profile.getDocuments.useQuery(undefined, { enabled: !!user });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    department: '',
    designation: '',
    avatarUrl: '',
    status: 'active' as string,
  });

  const updateMutation = trpc.profile.updateMyProfile.useMutation({
    onSuccess: () => setIsEditing(false),
  });

  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const profileUser = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name ?? '',
      department: user.department ?? 'Unassigned',
      designation: user.designation ?? 'Employee',
      avatarUrl: user.avatarUrl ?? '',
      status: user.status ?? 'active',
    };
  }, [user]);

  const userDocs = useMemo(() => {
    return (documents ?? []).filter((d: any) => d.user === user?.name);
  }, [documents, user?.name]);

  useEffect(() => {
    if (!profileUser) return;
    setForm({
      name: profileUser.name,
      department: profileUser.department,
      designation: profileUser.designation,
      avatarUrl: profileUser.avatarUrl,
      status: profileUser.status,
    });
  }, [profileUser]);

  const canSave = !!user && form.name.trim().length > 0;

  if (!user || sessionLoading || docsLoading || !profileUser) {
    return <div className="text-center p-8 text-white font-mono animate-pulse">Loading Profile Data...</div>;
  }

  const handleSubmit = async () => {
    if (!canSave) return;
    await updateMutation.mutateAsync({
      data: {
        name: form.name.trim(),
        department: form.department.trim() || null,
        designation: form.designation.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        status: form.status,
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <UserIcon className="text-[var(--ledger-blue)]" size={36} />
            {t('Employee Vault')}
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            {t('Centralized Identity, HR Records, and Asset Management.')}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-[var(--ledger-blue)] hover:text-black font-bold font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Edit3 size={14} /> {t('Edit Profile')}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  // reset
                  setForm({
                    name: profileUser.name,
                    department: profileUser.department,
                    designation: profileUser.designation,
                    avatarUrl: profileUser.avatarUrl,
                    status: profileUser.status,
                  });
                  setIsEditing(false);
                }}
                className="px-3 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 font-bold font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <X size={14} /> {t('Cancel')}
              </button>
              <button
                disabled={!canSave || updateMutation.isPending}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-[var(--ledger-blue)] text-black hover:opacity-95 font-bold font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={14} /> {updateMutation.isPending ? t('Saving...') : t('Save Changes')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* BENTO BOX GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- IDENTITY HUB --- */}
        <div className="md:col-span-1 md:row-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500 hover:border-white/20 group flex flex-col">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--ledger-blue)]/20 to-transparent" />

          <div className="p-6 sm:p-8 flex flex-col items-center text-center relative z-10 flex-1">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-[var(--bg-void)] border-4 border-[var(--ledger-blue)]/30 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(0,195,255,0.15)] group-hover:border-[var(--ledger-blue)]/60 transition-colors overflow-hidden">
              {profileUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold font-mono text-[var(--ledger-blue)]">{profileUser.name.charAt(0)}</span>
              )}
            </div>

            {isEditing ? (
              <label className="w-full text-left mb-4">
                <span className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">{t('Avatar URL')}</span>
                <input
                  value={form.avatarUrl}
                  onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
                  placeholder="https://..."
                />
              </label>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white tracking-tight">{profileUser.name}</h3>
                <p className="text-sm font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1 mb-4">{profileUser.designation}</p>
              </>
            )}

            <div className="w-full space-y-3 mt-2">
              {/* Name */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 gap-3">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 truncate">
                  <Hash size={12} /> {t('Name')}
                </span>
                {isEditing ? (
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="text-xs font-mono font-bold text-white bg-transparent outline-none w-40 max-w-[50%] text-right"
                  />
                ) : (
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[55%] text-right">{profileUser.name}</span>
                )}
              </div>

              {/* Department */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 gap-3">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 truncate">
                  <Building2 size={12} /> {t('Department')}
                </span>
                {isEditing ? (
                  <input
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    className="text-[10px] sm:text-xs font-mono font-bold text-white bg-transparent outline-none w-40 max-w-[50%] text-right"
                  />
                ) : (
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[55%] text-right">{profileUser.department}</span>
                )}
              </div>

              {/* Designation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 gap-3">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 truncate">
                  <MapPin size={12} /> {t('Position')}
                </span>
                {isEditing ? (
                  <input
                    value={form.designation}
                    onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                    className="text-[10px] sm:text-xs font-mono font-bold text-white bg-transparent outline-none w-40 max-w-[50%] text-right"
                  />
                ) : (
                  <span className="text-[10px] font-mono font-bold text-white truncate max-w-[55%] text-right">{profileUser.designation}</span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 gap-3">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 truncate">
                  <Shield size={12} /> {t('Status')}
                </span>
                {isEditing ? (
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="text-xs font-mono font-bold text-white bg-transparent outline-none w-40 max-w-[50%] text-right"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="paused">paused</option>
                  </select>
                ) : (
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--verify-green)] bg-[var(--verify-green)]/10 px-2 py-1 rounded">
                    {profileUser.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Settings (aligned; editable handled above) */}
          <div className="p-6 bg-black/60 border-t border-white/5 space-y-2">
            <h4 className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10 pb-2">
              {t('Personal Settings')}
            </h4>
            <div className="text-left text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
              {isEditing
                ? t('Update your information and save.')
                : t('Your profile is view-only. Tap Edit to update.')}
            </div>
          </div>
        </div>

        {/* --- HR MODULES (Span 2 Cols) --- */}
        <div className="md:col-span-2 space-y-6">
          {/* Row 1: Leave & Compensation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--verify-green)]/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={16} className="text-[var(--verify-green)]" /> {t('Time Off')}
                </h4>
                <button className="text-[9px] bg-[var(--verify-green)]/20 text-[var(--verify-green)] px-3 py-1 rounded-full uppercase tracking-widest font-bold hover:bg-[var(--verify-green)] hover:text-black transition-colors">
                  {t('Request')}
                </button>
              </div>

              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">{t('Annual Vacation')}</span>
                    <span className="text-white font-bold">14 / 20 Days</span>
                  </div>
                  <div className="w-full bg-black/50 border border-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--verify-green)] h-full transition-all" style={{ width: '70%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">{t('Sick Leave')}</span>
                    <span className="text-white font-bold">3 / 10 Days</span>
                  </div>
                  <div className="w-full bg-black/50 border border-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--signal-amber)] h-full transition-all" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Banknote size={16} className="text-purple-400" /> {t('Compensation')}
                </h4>
                {isAdmin ? (
                  <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 uppercase tracking-widest font-bold flex items-center gap-1">
                    <ShieldCheck size={10} /> {t('Admin View')}
                  </span>
                ) : (
                  <span className="text-[9px] bg-white/10 text-[var(--text-muted)] px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Shield size={10} /> {t('Private')}
                  </span>
                )}
              </div>

              <div className="space-y-4 relative z-10">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">{t('Base Salary')}</p>
                    {isAdmin ? <p className="text-xl font-bold text-white font-mono">$140,000</p> : <p className="text-xl font-bold text-[var(--text-muted)] font-mono">••••••••</p>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Briefcase size={16} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">{t('Next Review')}</p>
                    <p className="text-sm font-bold text-white font-mono">Nov 01, 2026</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[var(--ledger-blue)]/10 flex items-center justify-center text-[var(--ledger-blue)]">
                    <Clock size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Skills & Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Terminal size={16} className="text-cyan-400" /> {t('Core Competencies')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Node.js', 'System Architecture', 'GraphQL'].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-cyan-50 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-default transition-colors"
                  >
                    {skill}
                  </span>
                ))}
                {isAdmin && (
                  <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-dashed border-white/20 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:border-white/50 transition-colors">
                    {t('+ Add Skill')}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <HardDrive size={16} className="text-orange-400" /> {t('Assigned Assets')}
              </h4>
              <div className="space-y-3">
                {[
                  { id: 'A-1029', name: 'MacBook Pro 16" (M3)', status: 'Assigned' },
                  { id: 'A-5592', name: 'YubiKey 5C NFC', status: 'Assigned' },
                ].map((asset) => (
                  <div key={asset.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <HardDrive size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{asset.name}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mt-0.5">ID: {asset.id}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--verify-green)] bg-[var(--verify-green)]/10 px-2 py-1 rounded shrink-0">
                      {asset.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Document Vault */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-[var(--text-muted)]" /> {t('Secure Document Vault')}
              </h4>
              <button className="text-[10px] font-mono text-[var(--ledger-blue)] uppercase tracking-widest hover:underline flex items-center">
                {t('View All')} <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userDocs.length > 0 ? (
                userDocs.map((doc: any, i: number) => (
                  <button
                    key={i}
                    className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-[var(--ledger-blue)]/50 hover:bg-[var(--ledger-blue)]/5 transition-all text-left flex items-start gap-3"
                  >
                    <FileText size={18} className="text-[var(--ledger-blue)] mt-1" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white mb-1 truncate">{doc.title}</p>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                        {doc.type} • {new Date(doc.date).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-1 md:col-span-3 text-center p-8 border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">No documents available in vault</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

