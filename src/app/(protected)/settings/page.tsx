"use client";

import React from 'react';
import { Cpu, Activity, Database, Lock } from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';

type FlagKey = 'maintenanceMode' | 'debugLogging' | 'strictAuth' | 'autoProvision';

const DEFAULT_FLAGS: Record<FlagKey, boolean> = {
  maintenanceMode: false,
  debugLogging: true,
  strictAuth: true,
  autoProvision: false,
};

export default function SettingsPage() {
  const { user, isAdmin } = useUser();
  const { language } = useAppStore();
  const t = useTranslation(language);

  const { data: savedFlags } = trpc.settings.getSystemSettings.useQuery();
  const [flags, setFlags] = React.useState<Record<FlagKey, boolean>>(DEFAULT_FLAGS);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (savedFlags && !loaded) {
      const next = { ...DEFAULT_FLAGS };
      (Object.keys(DEFAULT_FLAGS) as FlagKey[]).forEach((k) => {
        if (savedFlags[k] !== undefined) next[k] = savedFlags[k] === 'true';
      });
      setFlags(next);
      setLoaded(true);
    }
  }, [savedFlags, loaded]);

  const handleToggle = (key: FlagKey) => {
    const value = !flags[key];
    setFlags((prev) => ({ ...prev, [key]: value }));
    // Persist immediately.
    trpc.settings.setSystemSetting.useMutation().mutate({ key, value: String(value) });
  };

  if (!user) return null;

  // Protect route
  if (!isAdmin) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <EmptyState title="Access Denied" description="System configuration requires Admin clearance." icon={<Lock className="h-5 w-5" />} />
      </div>
    );
  }

  const FLAG_COLORS: Record<string, string> = {
    maintenanceMode: 'var(--rose)',
    debugLogging: 'var(--brand)',
    strictAuth: 'var(--emerald)',
    autoProvision: 'var(--amber)',
  };

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Cpu className="h-5 w-5" />}
        title={t('System Configuration')}
        subtitle={t('Global policies & system variables.')}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Main Matrix Panel */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock size={20} className="text-[var(--brand-strong)]" /> {t('tRPC Permission Matrix')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead className="border border-[var(--border-hairline)] bg-[var(--bg-hover)] text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                    <tr>
                      <th className="rounded-tl-xl p-4 pl-6 whitespace-nowrap">{t('Resource Endpoint')}</th>
                      <th className="p-4 text-center whitespace-nowrap">{t('L4 Admin')}</th>
                      <th className="p-4 text-center whitespace-nowrap">{t('L3 HR')}</th>
                      <th className="rounded-tr-xl p-4 pr-6 text-center whitespace-nowrap">{t('L1 Employee')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)] border-x border-b border-[var(--border-hairline)] rounded-b-xl bg-[var(--bg-panel)] text-sm">
                    {[
                      { m: 'PAYROLL (Read/Write)', a: 'R/W/D', hr: 'R/W', e: 'R (Self)' },
                      { m: 'ATTENDANCE (Clock)', a: 'R/W/D', hr: 'R/W', e: 'R/W (Self)' },
                      { m: 'LEAVE (Approvals)', a: 'R/W', hr: 'R/W', e: 'None' },
                      { m: 'AUDIT (Immutable)', a: 'R (Immutable)', hr: 'None', e: 'None' },
                      { m: 'DEI (Intelligence)', a: 'R', hr: 'R', e: 'None' },
                      { m: 'RECRUITMENT (ATS)', a: 'R/W', hr: 'R/W', e: 'None' },
                    ].map((row, i) => (
                      <tr key={i} className="transition-colors hover:bg-[var(--bg-hover)]">
                        <td className="p-4 pl-6 font-semibold text-[var(--text-main)] whitespace-nowrap">{row.m}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <Badge variant="rose">{row.a}</Badge>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <Badge variant="amber">{row.hr}</Badge>
                        </td>
                        <td className="p-4 pr-6 text-center whitespace-nowrap">
                          <Badge variant="emerald">{row.e}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Metrics Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-[var(--brand-strong)]" /> {t('System Health')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-[var(--emerald)]" />
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{t('Database Status')}</span>
                </div>
                <Badge variant="emerald">{t('ONLINE')}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-[var(--brand-strong)]" />
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{t('tRPC Uptime')}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-strong)]">99.999%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-[var(--brand-strong)]" /> {t('System Flags')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'maintenanceMode', label: 'Maintenance Mode' },
                { key: 'debugLogging', label: 'Verbose Debug Logging' },
                { key: 'strictAuth', label: 'Strict 2FA Enforced' },
                { key: 'autoProvision', label: 'Auto-Provision Accounts' },
              ].map((flag) => {
                const on = flags[flag.key as keyof typeof flags];
                return (
                  <div key={flag.key} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--text-main)]">{t(flag.label)}</span>
                    <button
                      type="button"
                      onClick={() => handleToggle(flag.key as keyof typeof flags)}
                      className={`relative h-5 w-10 rounded-full transition-colors ${on ? 'bg-[var(--brand)]' : 'bg-[var(--bg-panel)] border border-[var(--border-hairline)]'}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
