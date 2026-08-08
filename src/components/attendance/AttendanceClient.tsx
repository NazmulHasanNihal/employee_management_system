'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Fingerprint, Activity, Power, Users, CheckCircle2, XCircle, AlertTriangle, UserPlus, Edit3, X, Search, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import useRealtimePresence from '@/lib/useRealtimePresence';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import AttendanceSparklineDynamic from '@/components/attendance/AttendanceSparklineDynamic';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
  avatarUrl: string | null;
  role: string;
}

interface AttendanceClientProps {
  initialLogs: any[];
  adminStats: any | null;
  initialEmployees?: EmployeeOption[];
  isAdmin: boolean;
  userId?: string | null;
}

export function AttendanceClient({ initialLogs, adminStats, initialEmployees = [], isAdmin, userId }: AttendanceClientProps) {
  const [logs, setLogs] = useState<any[]>(initialLogs || []);
  const utils = trpc.useUtils();

  // Live presence: managers get real-time punch updates from other employees.
  const socket = useRealtimePresence({
    room: 'attendance',
    onMessage: (data: unknown) => {
      const payload = data as { type?: string; userId?: string };
      if (payload?.type === 'punch') {
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
      toast.success('Clock In Recorded', 'Your attendance session has started.');
      setTimeout(() => setScanComplete(false), 3000);
    },
  });

  const clockOutMutation = trpc.attendance.clockOut.useMutation({
    onSuccess: () => {
      utils.attendance.getLogs.invalidate();
      utils.attendance.getAdminStats.invalidate();
      socket.send({ type: 'punch', userId });
      setClockedIn(false);
      toast.success('Clock Out Recorded', 'Your shift session has ended.');
    },
  });

  const recordManualEntryMutation = trpc.attendance.recordManualEntry.useMutation({
    onSuccess: () => {
      utils.attendance.getLogs.invalidate();
      utils.attendance.getAdminStats.invalidate();
      socket.send({ type: 'punch', userId });
      setIsModalOpen(false);
      toast.success('Attendance Entry Saved', 'The employee attendance record has been updated.');
    },
    onError: (err: any) => {
      toast.error('Failed to Save Entry', err?.message || 'An error occurred.');
    },
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  // HR / Admin Manual Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clockInTime, setClockInTime] = useState('09:00');
  const [clockOutTime, setClockOutTime] = useState('17:00');
  const [entryStatus, setEntryStatus] = useState('Present');
  const [hrNote, setHrNote] = useState('');

  // Fetch employees list if not provided
  const { data: fetchedEmployees } = trpc.attendance.getEmployees.useQuery(undefined, {
    enabled: isAdmin && initialEmployees.length === 0,
  });
  const employeeList: EmployeeOption[] = initialEmployees.length > 0 ? initialEmployees : (fetchedEmployees as EmployeeOption[]) || [];

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
    if (!geo && !clockedIn) {
      toast.error('Location Required', 'GPS verification is mandatory for clock-in to prevent proxy attendance.');
      return;
    }
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

  const handleOpenAddModal = (existingLog?: any) => {
    if (existingLog) {
      setSelectedEmpId(existingLog.userId || '');
      setEntryDate(new Date(existingLog.date).toISOString().split('T')[0]);
      setClockInTime(existingLog.clockIn ? new Date(existingLog.clockIn).toTimeString().slice(0, 5) : '09:00');
      setClockOutTime(existingLog.clockOut ? new Date(existingLog.clockOut).toTimeString().slice(0, 5) : '17:00');
      setEntryStatus(existingLog.status || 'Present');
      setHrNote(existingLog.location || 'HR Manual Verification');
    } else {
      setSelectedEmpId(employeeList[0]?.id || '');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setClockInTime('09:00');
      setClockOutTime('17:00');
      setEntryStatus('Present');
      setHrNote('HR Authorized Manual Entry');
    }
    setIsModalOpen(true);
  };

  const handleSaveManualEntry = () => {
    if (!selectedEmpId) {
      toast.error('Validation Error', 'Please select an employee');
      return;
    }
    recordManualEntryMutation.mutate({
      targetUserId: selectedEmpId,
      date: entryDate,
      clockInTime: entryStatus === 'Absent' ? undefined : clockInTime,
      clockOutTime: entryStatus === 'Absent' ? undefined : clockOutTime,
      status: entryStatus,
      note: hrNote,
    });
  };

  const handleDownloadPDF = async () => {
    try {
      if (!logs) return;
      const records = logs.map((log: any) => ({
        date: new Date(log.date).toLocaleDateString(),
        employee: log.userName || '',
        status: log.status,
        clockIn: log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--',
        clockOut: log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--',
      }));

      const res = await fetch('/api/reports/attendance-pdf', {
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

  const stats = adminStats || { onShift: 0, lateArrivals: 0, absent: 0, totalEmployees: 0, presentRate: 0, absenteeismRate: 0, onShiftPct: 0, attendanceTrend: [] };
  const onShiftPct = stats.totalEmployees > 0 ? Math.round((stats.onShift / stats.totalEmployees) * 100) : (stats.onShiftPct || 0);

  const filteredEmployees = employeeList.filter((emp) =>
    emp.name.toLowerCase().includes(employeeQuery.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(employeeQuery.toLowerCase())) ||
    emp.email.toLowerCase().includes(employeeQuery.toLowerCase())
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalLogs = logs?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / itemsPerPage));
  const paginatedLogs = logs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];


  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">{/* @ts-ignore */}<T>Time &amp; Attendance</T></h1>
            <p className="page-subtitle">{/* @ts-ignore */}<T>Biometric authorization, geo-location, and HR record management.</T></p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleOpenAddModal()}
              className="btn-primary flex items-center gap-2 rounded-xl text-xs font-semibold"
            >
              <UserPlus size={16} /> {/* @ts-ignore */}<T>Record Employee Attendance</T></Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="rounded-xl">
              {/* @ts-ignore */}<T>Generate PDF Report</T></Button>
          </div>
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
                <p className="text-sm uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Local Server Time</T></p>
                <h3 className="font-mono text-fluid-4xl font-bold tracking-widest text-[var(--text-main)]">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </h3>
                <p className="mt-2 text-xs uppercase text-[var(--brand-strong)]">{/* @ts-ignore */}<T>SYS_SYNC_OK</T></p>
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
                    <MapPin className="h-3 w-3 text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Location Data</T></span>
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
                    <Users className="h-4 w-4 text-[var(--emerald)]" /> {/* @ts-ignore */}<T>Live Office Status</T></span>
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
                      {/* @ts-ignore */}<T>Currently On-Shift</T></div>
                    <span className="flex items-center gap-2 text-xl font-bold text-[var(--text-main)]">
                      {stats.onShift}
                      <span className="text-xs font-normal text-[var(--text-muted)]">{onShiftPct}{/* @ts-ignore */}<T>% of staff</T></span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                    <div className="h-full rounded-full bg-[var(--emerald)]" style={{ width: `${onShiftPct}%` }} />
                  </div>
                  <AttendanceSparklineDynamic data={stats.attendanceTrend || []} />
                  <div className="grid grid-cols-3 gap-3 border-t border-[var(--border-hairline)] pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Present Rate</T></p>
                      <p className="flex items-center gap-2 text-lg font-bold text-[var(--emerald)]">
                        {stats.presentRate}% <CheckCircle2 className="h-3 w-3" />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Late Arrivals</T></p>
                      <p className="flex items-center gap-2 text-lg font-bold text-[var(--amber)]">
                        {stats.lateArrivals} <AlertTriangle className="h-3 w-3" />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Absent</T></p>
                      <p className="flex items-center gap-2 text-lg font-bold text-[var(--rose)]">
                        {stats.absent} <XCircle className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[var(--bg-hover)]/60 p-3">
                    <span className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Absenteeism Rate</T></span>
                    <DeltaBadge value={stats.absenteeismRate} label="of workforce" goodWhen="down" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Attendance Log</T></span>
                {isAdmin && (
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    {/* @ts-ignore */}<T>HR / Admin Override Enabled</T></span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{/* @ts-ignore */}<T>Date</T></TableHead>
                    <TableHead>{/* @ts-ignore */}<T>Employee</T></TableHead>
                    <TableHead>{/* @ts-ignore */}<T>Status</T></TableHead>
                    <TableHead>{/* @ts-ignore */}<T>Clock In</T></TableHead>
                    <TableHead>{/* @ts-ignore */}<T>Clock Out</T></TableHead>
                    {isAdmin && <TableHead title="Late minutes">{/* @ts-ignore */}<T>Late</T></TableHead>}
                    {isAdmin && <TableHead title="Overtime minutes">{/* @ts-ignore */}<T>OT</T></TableHead>}
                    {isAdmin && <TableHead title="Geo-fence verification">{/* @ts-ignore */}<T>Geo</T></TableHead>}
                    {isAdmin && <TableHead className="text-right">{/* @ts-ignore */}<T>Manage</T></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-semibold text-[var(--text-main)]">
                        {log.userName || log.user?.name || 'Employee'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'Present' ? 'emerald' : log.status === 'Late' ? 'amber' : 'rose'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[var(--text-muted)]">
                        {log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                      </TableCell>
                      <TableCell className="text-[var(--text-muted)]">
                        {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                      </TableCell>
                      {isAdmin && <TableCell className="text-[var(--text-muted)]">{log.lateMinutes ? `${log.lateMinutes}m` : '—'}</TableCell>}
                      {isAdmin && <TableCell className="text-[var(--text-muted)]">{log.overtimeMinutes ? `${Math.floor(log.overtimeMinutes / 60)}h${log.overtimeMinutes % 60}m` : '—'}</TableCell>}
                      {isAdmin && (
                        <TableCell>
                          {log.geoVerified === undefined ? '—' : log.geoVerified ? (
                            <span className="rounded-full bg-[var(--emerald-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--emerald)]">{/* @ts-ignore */}<T>Verified</T></span>
                          ) : (
                            <span className="rounded-full bg-[var(--rose-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--rose)]">{/* @ts-ignore */}<T>Unverified</T></span>
                          )}
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell className="text-right">
                          <button
                            onClick={() => handleOpenAddModal(log)}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--brand)]"
                            title="Edit In/Out Entry"
                          >
                            <Edit3 size={15} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {(!paginatedLogs || paginatedLogs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 9 : 5} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        {/* @ts-ignore */}<T>No logs found in archive. HR/Admin can record entries using the top button.</T></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Showing <span className="font-bold text-[var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[var(--text-main)]">{Math.min(currentPage * itemsPerPage, totalLogs)}</span> of <span className="font-bold text-[var(--text-main)]">{totalLogs}</span> entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg h-8"
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-semibold px-2">Page {currentPage} of {totalPages}</span>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* HR / Admin Attendance Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-[var(--brand)]" />
                <h3 className="text-base font-bold text-[var(--text-main)]">{/* @ts-ignore */}<T>HR / Admin Attendance Record Entry</T></h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Employee Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Select Employee</T></label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Filter employee list..."
                    value={employeeQuery}
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl pl-9 pr-3 py-2 text-xs mb-2"
                  />
                </div>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  <option value="">Select Employee...</option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department || emp.role} · {emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Attendance Date</T></label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Status</T></label>
                <div className="flex gap-2">
                  {['Present', 'Late', 'Absent'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEntryStatus(st)}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all border ${
                        entryStatus === st
                          ? st === 'Present'
                            ? 'bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]'
                            : st === 'Late'
                              ? 'bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber)]'
                              : 'bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Pickers (if not Absent) */}
              {entryStatus !== 'Absent' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>In Time</T></label>
                    <input
                      type="time"
                      value={clockInTime}
                      onChange={(e) => setClockInTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Out Time</T></label>
                    <input
                      type="time"
                      value={clockOutTime}
                      onChange={(e) => setClockOutTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
              )}

              {/* HR Verification Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>HR Verification Note / Reason</T></label>
                <input
                  type="text"
                  placeholder="e.g. Verified In/Out by HR Admin"
                  value={hrNote}
                  onChange={(e) => setHrNote(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl border border-[var(--border-hairline)] py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
              >
                {/* @ts-ignore */}<T>Cancel</T></button>
              <button
                type="button"
                onClick={handleSaveManualEntry}
                disabled={recordManualEntryMutation.isPending}
                className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {recordManualEntryMutation.isPending ? 'Saving...' : 'Save Attendance Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
