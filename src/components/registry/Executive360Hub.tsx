'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  User,
  TrendingUp,
  CalendarDays,
  Award,
  Briefcase,
  Building2,
  FileText,
  Monitor,
  Activity,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react';
import { fetchEmployee360 } from '@/app/actions/admin';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { toast } from '@/lib/toast';
import { T } from '@/components/Translate';

interface EmployeeOption {
  id: string;
  name: string;
  role: string;
  designation?: string | null;
  department?: string | null;
}

export function Executive360Hub({ employees = [] }: { employees: EmployeeOption[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data360, setData360] = useState<any>(null);

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setData360(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchEmployee360(userId);
      setData360(res);
    } catch (err: any) {
      toast.error('Fetch Failed', err?.message || 'Could not load executive 360 dossier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER & SEARCH BAR ── */}
      <Card className="border border-[var(--brand)]/30 bg-[var(--bg-panel)] shadow-xl rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--brand)]/10 p-3 text-[var(--brand)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">
                  {/* @ts-ignore */}<T>Executive 360 Intelligence Hub</T>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>Restricted dossier view for CEO, Admin, and HR clearance.</T>
                </p>
              </div>
            </div>
            <Badge variant="brand" className="w-fit gap-1">
              <Zap size={12} /> {/* @ts-ignore */}<T>Executive Clearance</T>
            </Badge>
          </div>

          <div className="max-w-xl">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              {/* @ts-ignore */}<T>Select Employee or Manager to Inspect</T>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleSelectUser(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-4 py-3 text-sm font-semibold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="">{/* @ts-ignore */}<T>Search or Choose Personnel...</T></option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation || emp.role || 'Staff'}) — {emp.department || 'Unassigned'}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── DOSSIER DISPLAY ── */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
            <span className="text-sm font-medium">Gathering 360 Dossier Analytics...</span>
          </div>
        </div>
      )}

      {data360 && !loading && (
        <div className="space-y-6 animate-in fade-in">
          {/* 1. Identity Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 rounded-3xl">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <Avatar src={data360.user.avatarUrl} name={data360.user.name} size="xxl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)]">{data360.user.name}</h3>
                  <p className="text-xs text-[var(--brand)] font-semibold mt-0.5">{data360.user.designation || data360.user.role}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="brand">{data360.user.role}</Badge>
                  <Badge variant="secondary">{data360.user.department || 'General'}</Badge>
                  <Badge variant={data360.user.status === 'active' ? 'emerald' : 'amber'}>
                    {data360.user.status || 'Active'}
                  </Badge>
                </div>
                <div className="border-t border-[var(--border-hairline)] pt-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Monthly Salary</span>
                    <span className="font-bold text-[var(--emerald)]">
                      {data360.user.baseSalary ? formatCurrency(data360.user.baseSalary, 'BDT', 'en') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Reports To</span>
                    <span className="font-semibold text-[var(--text-main)]">{data360.user.manager?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Joined</span>
                    <span className="font-medium text-[var(--text-main)]">{data360.user.joinDate ? formatDate(data360.user.joinDate) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">NID</span>
                    <span className="font-mono text-[var(--text-main)]">{data360.user.nidMasked || '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Attendance & Performance High-level Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attendance Card */}
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    <CalendarDays className="h-4 w-4 text-[var(--emerald)]" />
                    {/* @ts-ignore */}<T>Attendance & Time-Off</T>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-hover)] p-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Attendance Rate</p>
                      <p className="text-2xl font-bold text-[var(--emerald)]">{data360.attendance.rate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Present Tracked</p>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        {data360.attendance.presentDays} / {data360.attendance.totalTrackedDays} Days
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">Leave Balances</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[var(--border-hairline)] p-2.5">
                        <span className="text-[var(--text-muted)] block">Earned Leave</span>
                        <span className="font-bold text-[var(--emerald)]">
                          {data360.leaveBalance?.Earned?.used || 0} / {data360.leaveBalance?.Earned?.total || 0}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[var(--border-hairline)] p-2.5">
                        <span className="text-[var(--text-muted)] block">Sick Leave</span>
                        <span className="font-bold text-[var(--amber)]">
                          {data360.leaveBalance?.Sick?.used || 0} / {data360.leaveBalance?.Sick?.total || 0}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[var(--border-hairline)] p-2.5">
                        <span className="text-[var(--text-muted)] block">Casual Leave</span>
                        <span className="font-bold text-[var(--sky)]">
                          {data360.leaveBalance?.Casual?.used || 0} / {data360.leaveBalance?.Casual?.total || 0}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[var(--border-hairline)] p-2.5">
                        <span className="text-[var(--text-muted)] block">Festival Leave</span>
                        <span className="font-bold text-[var(--brand)]">
                          {data360.leaveBalance?.Festival?.used || 0} / {data360.leaveBalance?.Festival?.total || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Card */}
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    <Award className="h-4 w-4 text-[var(--amber)]" />
                    {/* @ts-ignore */}<T>Performance & Reviews</T>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-hover)] p-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Average Review Score</p>
                      <p className="text-2xl font-bold text-[var(--amber)]">
                        {data360.performance.avgRating ? `${data360.performance.avgRating} / 5.0` : 'No Rating'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Completed Reviews</p>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        {data360.performance.totalReviews} Records
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recent Reviews</p>
                    {(!data360.performance?.recentReviews || data360.performance.recentReviews.length === 0) ? (
                      <p className="text-[var(--text-muted)] italic">No review records found.</p>
                    ) : (
                      data360.performance.recentReviews.slice(0, 3).map((r: any) => (
                        <div key={r.id} className="flex justify-between items-center rounded-xl border border-[var(--border-hairline)] p-2.5">
                          <div>
                            <span className="font-semibold text-[var(--text-main)] block">{r.reviewPeriod || 'Performance Review'}</span>
                            <span className="text-[var(--text-muted)] text-[10px]">{formatDate(r.createdAt)}</span>
                          </div>
                          <Badge variant="amber">{r.rating ? `${r.rating}` : 'Pending'}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. Compensation & Audit History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
                  {/* @ts-ignore */}<T>Compensation Adjustment History</T>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data360.compensationHistory || data360.compensationHistory.length === 0) ? (
                  <p className="text-xs text-[var(--text-muted)] italic">No salary adjustments logged.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {data360.compensationHistory.map((adj: any) => (
                      <div key={adj.id} className="flex justify-between items-center rounded-xl border border-[var(--border-hairline)] p-3 text-xs">
                        <div>
                          <p className="font-semibold text-[var(--text-main)]">
                            {adj.type} · {adj.reason}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">Effective {formatDate(adj.effectiveDate)}</p>
                        </div>
                        <div className="text-right">
                          <span className={adj.delta >= 0 ? 'font-bold text-[var(--emerald)]' : 'font-bold text-[var(--rose)]'}>
                            {formatCurrency(adj.newSalary, 'BDT', 'en')}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block">({adj.delta >= 0 ? '+' : ''}{adj.percentage ?? 0}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <Activity className="h-4 w-4 text-[var(--rose)]" />
                  {/* @ts-ignore */}<T>Executive Security & Audit Trail</T>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data360.recentAuditLogs || data360.recentAuditLogs.length === 0) ? (
                  <p className="text-xs text-[var(--text-muted)] italic">No recent audit logs recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {data360.recentAuditLogs.map((log: any) => (
                      <div key={log.id} className="rounded-xl border border-[var(--border-hairline)] p-2.5 text-xs">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-[var(--text-main)]">{log.action}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">{log.details || 'System event recorded'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
