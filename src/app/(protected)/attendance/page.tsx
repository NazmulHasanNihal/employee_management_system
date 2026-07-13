"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, MapPin, Fingerprint, Activity, Power, 
  Users, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

export default function AttendancePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const { data: logs, isLoading: loadingLogs } = trpc.attendance.getLogs.useQuery({});
  
  // Terminal Simulation State
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    if (clockedIn) {
      setClockedIn(false);
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setClockedIn(true);
      setTimeout(() => setScanComplete(false), 3000);
    }, 2000);
  };

  if (loadingLogs) return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Initializing Terminal...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--verify-green)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Activity className="text-[var(--verify-green)]" size={36} />
            Time & Attendance
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Biometric Authorization and Geo-Location Terminal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Clock-In Terminal & Live Status */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* High-Tech Terminal */}
          <div className={`bg-[#0a0a0a] border rounded-3xl p-8 relative overflow-hidden transition-all duration-500 shadow-2xl ${
            isScanning ? 'border-[var(--ledger-blue)] shadow-[0_0_30px_rgba(0,195,255,0.3)]' : 
            scanComplete ? 'border-[var(--verify-green)] shadow-[0_0_30px_rgba(0,255,100,0.3)]' : 
            clockedIn ? 'border-[var(--verify-green)]/50' : 'border-white/10 hover:border-white/20'
          }`}>
            
            {isScanning && (
              <div className="absolute inset-0 bg-[var(--ledger-blue)]/5 animate-pulse" />
            )}

            <div className="text-center relative z-10 mb-8">
              <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-widest mb-2">Local Server Time</p>
              <h3 className="text-4xl font-mono font-bold text-white tracking-widest">{currentTime.toLocaleTimeString([], {hour12: false})}</h3>
              <p className="font-mono text-[10px] text-[var(--ledger-blue)] uppercase mt-2">SYS_SYNC_OK // UTC-OFFSET:-0800</p>
            </div>

            {/* Scan Area */}
            <div className="flex justify-center mb-8 relative z-10">
              <button 
                onClick={handleClockIn}
                disabled={isScanning}
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 group ${
                  isScanning ? 'border-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10 scale-95' :
                  scanComplete ? 'border-[var(--verify-green)] bg-[var(--verify-green)]/10 scale-105' :
                  clockedIn ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500' :
                  'border-white/10 bg-black/50 hover:border-[var(--ledger-blue)] hover:bg-[var(--ledger-blue)]/5'
                }`}
              >
                {isScanning ? (
                  <Activity size={32} className="text-[var(--ledger-blue)] animate-bounce" />
                ) : scanComplete ? (
                  <CheckCircle2 size={32} className="text-[var(--verify-green)]" />
                ) : clockedIn ? (
                  <Power size={32} className="text-red-500" />
                ) : (
                  <Fingerprint size={32} className="text-[var(--text-muted)] group-hover:text-[var(--ledger-blue)] transition-colors" />
                )}
                
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                  isScanning ? 'text-[var(--ledger-blue)] animate-pulse' :
                  scanComplete ? 'text-[var(--verify-green)]' :
                  clockedIn ? 'text-red-500' : 'text-[var(--text-muted)]'
                }`}>
                  {isScanning ? 'Scanning...' : scanComplete ? 'Auth OK' : clockedIn ? 'Clock Out' : 'Clock In'}
                </span>
              </button>
            </div>

            {/* Geo-Location Mock */}
            <div className="bg-black/50 p-4 rounded-xl border border-white/5 relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={12} className="text-[var(--ledger-blue)]" /> Location Data
                </span>
                <span className="text-[9px] bg-[var(--verify-green)]/20 text-[var(--verify-green)] px-1.5 py-0.5 rounded uppercase font-bold">Secure</span>
              </div>
              <p className="text-xs font-mono text-white">37.7749° N, 122.4194° W</p>
              <p className="text-[9px] font-mono text-[var(--text-muted)] mt-1">IP: 192.168.1.104 (San Francisco HQ)</p>
            </div>
          </div>

          {/* Live Office Status (Admin Feature) */}
          {isAdmin && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/5 to-transparent pointer-events-none" />
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Users size={14} className="text-[var(--verify-green)]"/> Live Office Status
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-mono text-white">
                    <div className="w-2 h-2 rounded-full bg-[var(--verify-green)] shadow-[0_0_8px_var(--verify-green)] animate-pulse" />
                    Currently On-Shift
                  </div>
                  <span className="text-xl font-bold font-mono text-white">42</span>
                </div>
                
                <div className="w-full bg-black/50 border border-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--verify-green)] h-full transition-all w-[70%]"></div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Late Arrivals</p>
                    <p className="text-lg font-mono font-bold text-[var(--signal-amber)] flex items-center gap-2">
                      3 <AlertTriangle size={12} />
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Absent</p>
                    <p className="text-lg font-mono font-bold text-red-500 flex items-center gap-2">
                      1 <XCircle size={12} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sleek Data Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-2xl flex flex-col h-[650px]">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={14} className="text-[var(--ledger-blue)]"/> Attendance Log
            </h4>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar border border-white/10 rounded-2xl bg-black/40">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-normal border-b border-white/10">Date</th>
                    {isAdmin && <th className="p-4 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-normal border-b border-white/10">Employee</th>}
                    <th className="p-4 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-normal border-b border-white/10">Status</th>
                    <th className="p-4 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-normal border-b border-white/10">Clock In</th>
                    <th className="p-4 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-normal border-b border-white/10">Clock Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs font-mono text-white whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-sm font-sans font-bold text-white whitespace-nowrap">
                          {log.userName}
                        </td>
                      )}
                      <td className="p-4">
                        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border ${
                          log.status === 'Present' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30' :
                          log.status === 'Late' ? 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30' :
                          'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                        {log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </td>
                      <td className="p-4 text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                        {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </td>
                    </tr>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                        No logs found in archive.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
