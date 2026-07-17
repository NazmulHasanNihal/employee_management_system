'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Fingerprint, Activity, Power, Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import useRealtimePresence from '@/lib/useRealtimePresence';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface AttendanceClientProps {
  initialLogs: any[];
  adminStats: any | null;
  isAdmin: boolean;
  userId?: string | null;
}

export function AttendanceClient({ initialLogs, adminStats, isAdmin, userId }: AttendanceClientProps) {
  const [logs, setLogs] = useState<any[]>(initialLogs || []);
  const utils = trpc.useUtils();

  // Live presence: managers get real-time punch updates from other employees.
  const socket = useRealtimePresence({
    room: 'attendance',
    onMessage: (data) => {
      if (data?.type === 'punch') {
        // Someone else punched — refresh the manager's live stats + logs.
        utils.attendance.getAdminStats.invalidate();
        utils.attendance.getLogs.invalidate();
      }
    },
  });

  const clockInMutation = trpc.attendance.clockIn.useMutation({
    onSuccess: () => {
      utils.attendance.getLogs.invalidate();
      utils.attendance.getAdminStats.invalidate();
      socket.send({ type: 'punch', userId });
      setClockedIn(true);
      setScanComplete(true);
      setTimeout(() => setScanComplete(false), 3000);
    },
  });

  const clockOutMutation = trpc.attendance.clockOut.useMutation({
    onSuccess: () => {
      utils.attendance.getLogs.invalidate();
      utils.attendance.getAdminStats.invalidate();
      socket.send({ type: 'punch', userId });
      setClockedIn(false);
    },
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const ns = latitude >= 0 ? 'N' : 'S';
          const ew = longitude >= 0 ? 'E' : 'W';
          setGeo({ lat: latitude, lng: longitude });
          setLocation(`${Math.abs(latitude).toFixed(4)}° ${ns}, ${Math.abs(longitude).toFixed(4)}° ${ew}`);
        },
        () => setLocation('Location unavailable')
      );
    }
  }, []);

  useEffect(() => {
    if (logs && logs.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLog = logs.find((l: any) => {
        const logDate = new Date(l.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime() && !l.clockOut;
      });
      if (todayLog) setClockedIn(true);
    }
  }, [logs]);

  const handleClockIn = () => {
    if (clockedIn) {
      setIsScanning(true);
      setTimeout(() => {
        clockOutMutation.mutate({});
        setIsScanning(false);
      }, 1500);
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      clockInMutation.mutate({
        location: location || undefined,
        geoLat: geo?.lat,
        geoLng: geo?.lng,
      });
      setIsScanning(false);
    }, 2000);
  };

  const handleDownloadPDF = async () => {
    try {
      if (!logs) return;
      const records = logs.map((log: any) => ({
        date: new Date(log.date).toLocaleDateString(),
        employee: log.userName || '',
        status: log.status,
        clockIn: log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        clockOut: log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
      }));

      const res = await fetch('http://localhost:8080/api/reports/attendance-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stats = adminStats || { onShift: 0, lateArrivals: 0, absent: 0, totalEmployees: 0 };
  const onShiftPct = stats.totalEmployees > 0 ? Math.round((stats.onShift / stats.totalEmployees) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Time &amp; Attendance</h1>
            <p className="page-subtitle">Biometric authorization and geo-location terminal.</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            Generate PDF Report
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card
            className={`transition-all duration-500 ${
              isScanning
                ? 'border-[var(--brand)] shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                : scanComplete
                  ? 'border-[var(--emerald)]'
                  : clockedIn
                    ? 'border-[var(--emerald)]/50'
                    : ''
            }`}
          >
            <CardContent className="relative overflow-hidden p-8">
              {isScanning && <div className="absolute inset-0 animate-pulse bg-[var(--brand-soft)]" />}
              <div className="relative z-10 mb-8 text-center">
                <p className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Local Server Time</p>
                <h3 className="font-mono text-4xl font-bold tracking-widest text-[var(--text-main)]">
                  {currentTime.toLocaleTimeString([], { hour12: false })}
                </h3>
                <p className="mt-2 text-xs uppercase text-[var(--brand-strong)]">SYS_SYNC_OK</p>
              </div>

              <div className="relative z-10 flex justify-center">
                <button
                  onClick={handleClockIn}
                  disabled={isScanning}
                  className={`flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-full border-4 transition-all duration-300 ${
                    isScanning
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                      : scanComplete
                        ? 'border-[var(--emerald)] bg-[var(--emerald-soft)]'
                        : clockedIn
                          ? 'border-[var(--rose)]/50 bg-[var(--rose-soft)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-hover)] hover:border-[var(--brand)]'
                  }`}
                >
                  {isScanning ? (
                    <Activity className="h-8 w-8 animate-bounce text-[var(--brand-strong)]" />
                  ) : scanComplete ? (
                    <CheckCircle2 className="h-8 w-8 text-[var(--emerald)]" />
                  ) : clockedIn ? (
                    <Power className="h-8 w-8 text-[var(--rose)]" />
                  ) : (
                    <Fingerprint className="h-8 w-8 text-[var(--text-muted)]" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {isScanning ? 'Scanning...' : scanComplete ? 'Auth OK' : clockedIn ? 'Clock Out' : 'Clock In'}
                  </span>
                </button>
              </div>

              <div className="relative z-10 mt-8 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    <MapPin className="h-3 w-3 text-[var(--brand-strong)]" /> Location Data
                  </span>
                  <span className="rounded bg-[var(--emerald-soft)] px-1.5 py-0.5 text-xs font-bold uppercase text-[var(--emerald)]">
                    {location ? 'Detected' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-main)]">{location || 'Acquiring location...'}</p>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--emerald)]" /> Live Office Status
                  </span>
                  <span className={`flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest ${socket.connected ? 'text-[var(--emerald)]' : 'text-[var(--text-muted)]'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${socket.connected ? 'bg-[var(--emerald)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                    {socket.connected ? 'Live' : 'Offline'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--emerald)]" />
                      Currently On-Shift
                    </div>
                    <span className="text-xl font-bold text-[var(--text-main)]">{stats.onShift}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                    <div className="h-full rounded-full bg-[var(--emerald)]" style={{ width: `${onShiftPct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-hairline)] pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Late Arrivals</p>
                      <p className="flex items-center gap-2 text-lg font-bold text-[var(--amber)]">
                        {stats.lateArrivals} <AlertTriangle className="h-3 w-3" />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Absent</p>
                      <p className="flex items-center gap-2 text-lg font-bold text-[var(--rose)]">
                        {stats.absent} <XCircle className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--brand-strong)]" /> Attendance Log
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {isAdmin && <TableHead>Employee</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    {isAdmin && <TableHead title="Late minutes">Late</TableHead>}
                    {isAdmin && <TableHead title="Overtime minutes">OT</TableHead>}
                    {isAdmin && <TableHead title="Night-shift minutes">Night</TableHead>}
                    {isAdmin && <TableHead title="Geo-fence verification">Geo</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </TableCell>
                      {isAdmin && <TableCell className="font-semibold text-[var(--text-main)]">{log.userName}</TableCell>}
                      <TableCell>
                        <Badge variant={log.status === 'Present' ? 'emerald' : log.status === 'Late' ? 'amber' : 'rose'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[var(--text-muted)]">
                        {log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </TableCell>
                      <TableCell className="text-[var(--text-muted)]">
                        {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </TableCell>
                      {isAdmin && <TableCell className="text-[var(--text-muted)]">{log.lateMinutes ? `${log.lateMinutes}m` : '—'}</TableCell>}
                      {isAdmin && <TableCell className="text-[var(--text-muted)]">{log.overtimeMinutes ? `${Math.floor(log.overtimeMinutes / 60)}h${log.overtimeMinutes % 60}m` : '—'}</TableCell>}
                      {isAdmin && <TableCell className="text-[var(--text-muted)]">{log.nightMinutes ? `${Math.floor(log.nightMinutes / 60)}h${log.nightMinutes % 60}m` : '—'}</TableCell>}
                      {isAdmin && (
                        <TableCell>
                          {log.geoVerified === undefined ? '—' : log.geoVerified ? (
                            <span className="rounded-full bg-[var(--emerald-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--emerald)]">Verified</span>
                          ) : (
                            <span className="rounded-full bg-[var(--rose-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--rose)]">Unverified</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 9 : 5} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        No logs found in archive. Clock in to start recording.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
