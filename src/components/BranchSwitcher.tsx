'use client';

import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import { getTranslation, type Lang } from '@/lib/translations';

const BRANCH_COOKIE = 'ems_branch';

/**
 * Branch switcher for admins/CEOs. Regular employees see their own branch
 * (locked). Selection is persisted to a cookie and a router.refresh() re-runs
 * the server queries so dashboards/attendance/payroll scope to the branch.
 */
export function BranchSwitcher({ lang }: { lang?: Lang }) {
  const router = useRouter();
  const { user, isAdmin, isCEO } = useUser();
  const t = getTranslation(lang || 'en');

  const isPrivileged = isAdmin || isCEO;
  const { data: branches = [] } = trpc.branch.list.useQuery(undefined, { enabled: isPrivileged });

  const current =
    typeof document !== 'undefined'
      ? document.cookie.match(/(?:^|; )ems_branch=([^;]+)(?:;|$)/)?.[1]
      : undefined;

  if (!isPrivileged) {
    const myBranch = (branches || []).find((b: any) => b.id === user?.branchId);
    return (
      <div
        title={t('Branch')}
        className="hidden items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] md:flex"
      >
        <Building2 size={14} />
        <span className="max-w-[120px] truncate">{myBranch?.name || t('Branch')}</span>
      </div>
    );
  }

  const selected = current || user?.branchId || 'all';

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    document.cookie = `${BRANCH_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className="relative hidden md:flex items-center">
      <Building2 size={14} className="pointer-events-none absolute left-2.5 text-[var(--text-muted)]" />
      <select
        aria-label={t('Select Branch')}
        value={selected}
        onChange={onChange}
        className="appearance-none rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-app)] py-1.5 pl-8 pr-7 text-xs font-medium text-[var(--text-main)] outline-none transition-colors hover:border-[var(--brand)]"
      >
        <option value="all">{t('All Branches')}</option>
        {(branches || []).map((b: any) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 text-[var(--text-muted)]" />
    </div>
  );
}
