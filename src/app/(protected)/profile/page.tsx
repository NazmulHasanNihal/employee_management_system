import React from 'react';
import { User as UserIcon, CalendarDays, Banknote, FileText, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getSkills,
  getDocuments,
  getMyReviews,
  getLeaveBalance,
  getActivityHeatmap,
} from '@/server/queries';
import { formatCurrency, formatDate } from '@/lib/format';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { getServerT } from '@/lib/i18n-server';

import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { EditableName } from '@/components/profile/EditableName';
import {
  ContactSection,
  EmergencySection,
  SocialSection,
  BioSection,
  EmploymentSection,
  IdentitySection,
  type ProfileUser,
} from '@/components/profile/EditableSections';
import { SkillsManager } from '@/components/profile/SkillsManager';
import { DocumentVault } from '@/components/profile/DocumentVault';
import { DelegationSettings } from '@/components/profile/DelegationSettings';
import { SprintHeatmap } from '@/components/profile/SprintHeatmap';
import { ReviewsRadarIsland, CombatStatsIsland } from '@/components/profile/ChartIslands';

function maskSalary() {
  return '••••••••';
}

export default async function ProfilePage() {
  const caller = await getCaller();
  const t = await getServerT();
  if (!caller) {
    return (
      <EmptyState
        title={t('Not signed in')}
        description={t("We couldn't load your profile. Please sign in and try again.")}
        icon={<UserIcon size={24} />}
      />
    );
  }

  const user = await prisma.user.findUnique({ where: { id: caller.id } });
  if (!user) {
    return <EmptyState title={t('Profile not found')} description={t('No user record matched your account.')} icon={<UserIcon size={24} />} />;
  }

  const manager = user.managerId
    ? await prisma.user.findUnique({ where: { id: user.managerId }, select: { name: true } })
    : null;

  // Lookups that power the new dropdowns (branch, manager). Countries come from
  // a curated static list (see EditableSections DEFAULT_COUNTRIES) so the page
  // never depends on the optional Country table being generated.
  const [branches, managers] = await Promise.all([
    prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { id: { not: caller.id }, status: { not: 'Terminated' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  const countries: string[] = [];

  const branch = user.branchId
    ? branches.find((b) => b.id === user.branchId) ?? null
    : null;

  const [skills, documents, reviews, leaveBalance, activity] = await Promise.all([
    getSkills(caller),
    getDocuments(caller),
    getMyReviews(caller),
    getLeaveBalance(caller),
    getActivityHeatmap(caller),
  ]);

  const isAdmin = caller.isAdmin;
  const isCEO = caller.isCEO;
  // Salary is role-aware: visible only to admins, CEO, or if the owner is an admin.
  const canViewSalary = isAdmin || isCEO || user.role === 'Admin';

  const employmentBadge =
    user.employmentType === 'Full-Time'
      ? 'brand'
      : user.employmentType === 'Part-Time'
      ? 'sky'
      : user.employmentType === 'Contract'
      ? 'amber'
      : 'secondary';

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={t('My Profile')}
        subtitle={t('Your identity, contact details, employment info, and performance at a glance.')}
        icon={<UserIcon className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Identity hub ── */}
        <div className="lg:col-span-1">
          <Card className="flex h-full flex-col items-center text-center">
            <div className="flex flex-col items-center gap-4 py-2">
              <AvatarUpload currentUrl={user.avatarUrl} size="xl" />
              <div>
                <EditableName name={user.name} />
                <p className="text-sm text-[var(--text-muted)]">{user.designation || 'Employee'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="brand">{user.department || 'Unassigned'}</Badge>
                <Badge variant={employmentBadge}>{user.employmentType || 'Full-Time'}</Badge>
                <StatusPill
                  status={user.status === 'active' ? 'success' : user.status === 'Terminated' ? 'error' : 'pending'}
                  label={user.status || 'active'}
                />
              </div>
            </div>

            <div className="mt-4 w-full space-y-2 border-t border-[var(--border-hairline)] pt-4 text-left">
              <InfoLine icon={<CalendarDays size={14} />} label="Joined" value={user.joinDate ? formatDate(user.joinDate, 'en') : '—'} />
              <InfoLine icon={<UserIcon size={14} />} label="Manager" value={manager?.name || '—'} />
              <InfoLine icon={<Sparkles size={14} />} label="Branch" value={branch?.name || '—'} />
              <InfoLine icon={<Sparkles size={14} />} label="Employee ID" value={user.id.slice(0, 8)} />
            </div>
          </Card>
        </div>

        {/* ── Right column: editable sections ── */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactSection user={user as ProfileUser} countries={countries} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
              <CardContent>              <EmergencySection user={user as ProfileUser} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
              <CardContent><EmploymentSection user={user as ProfileUser} managerName={manager?.name} branchName={branch?.name ?? null} branches={branches} managers={managers} /></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
              <CardContent><SocialSection user={user as ProfileUser} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
              <CardContent><BioSection user={user as ProfileUser} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Bangladesh Identity</CardTitle></CardHeader>
            <CardContent><IdentitySection user={user as ProfileUser} /></CardContent>
          </Card>
        </div>
      </div>

      {/* ── Secondary grid: skills, docs, leave, comp, reviews ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap size={16} className="text-[var(--amber)]" /> Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillsManager initialSkills={skills.map((s: { id: string; skill: string; level: number }) => ({ id: s.id, skill: s.skill, level: s.level }))} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={16} className="text-[var(--brand-strong)]" /> Document Vault</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentVault documents={documents.map((d: { id: string; title: string; url: string; type: string; createdAt: Date }) => ({ id: d.id, title: d.title, url: d.url, type: d.type, createdAt: d.createdAt }))} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays size={16} className="text-[var(--emerald)]" /> Time Off</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaveBalance ? (
              <>
                <LeaveBar label="Earned / Annual" used={leaveBalance.Earned?.used || 0} total={leaveBalance.Earned?.total || 0} color="var(--emerald)" />
                <LeaveBar label="Sick Leave" used={leaveBalance.Sick?.used || 0} total={leaveBalance.Sick?.total || 0} color="var(--amber)" />
                <LeaveBar label="Casual" used={leaveBalance.Casual?.used || 0} total={leaveBalance.Casual?.total || 0} color="var(--sky)" />
                <LeaveBar label="Festival" used={leaveBalance.Festival?.used || 0} total={leaveBalance.Festival?.total || 0} color="var(--brand-strong)" />
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote size={16} className="text-[var(--brand-strong)]" /> Compensation</CardTitle>
            {canViewSalary ? (
              <Badge variant="brand" className="gap-1"><ShieldCheck size={12} /> Admin View</Badge>
            ) : (
              <Badge variant="secondary" className="gap-1"><ShieldCheck size={12} /> Private</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
              <p className="text-xs text-[var(--text-muted)]">Base Salary</p>
              <p className="text-xl font-semibold text-[var(--text-main)]">
                {canViewSalary ? (user.baseSalary ? formatCurrency(user.baseSalary, 'BDT', 'en') : '—') : maskSalary()}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
              <p className="text-xs text-[var(--text-muted)]">Next Review</p>
              <p className="text-sm font-medium text-[var(--text-main)]">
                {reviews.reviews.length > 0 ? reviews.reviews[0].reviewPeriod : 'Not scheduled'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reviews radar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles size={16} className="text-[var(--brand-strong)]" /> Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.scores.length === 0 ? (
              <EmptyState
                title="No review scores yet"
                description="Once your manager submits reviews, your competency radar will appear here."
                icon={<Sparkles size={22} />}
              />
            ) : (
              <ReviewsRadarIsland scores={reviews.scores} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Feature components (rebuilt on new UI) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <CombatStatsIsland user={user as ProfileUser} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <DelegationSettings
              user={{
                proxyId: user.proxyId,
                proxyValidUntil: user.proxyValidUntil,
                proxyName: manager?.name ?? null,
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <SprintHeatmap data={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        {label}
      </span>
      <span className="truncate font-medium text-[var(--text-main)]">{value}</span>
    </div>
  );
}

function LeaveBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-medium text-[var(--text-main)]">{used} / {total}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
