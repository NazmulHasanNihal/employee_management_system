"use client";

import React from 'react';
import { Activity, Clock, LogOut, MapPin, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceTableProps {
  logs: any[];
  isAdmin: boolean;
}

export function AttendanceTable({ logs, isAdmin }: AttendanceTableProps) {
  return (
    <Card className="bg-black/60 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-[var(--ledger-blue)]" /> Attendance Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!logs || logs.length === 0) ? (
          <div className="p-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl">
            No attendance records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="font-mono text-xs text-[var(--text-muted)]">Date</TableHead>
                {isAdmin && <TableHead className="font-mono text-xs text-[var(--text-muted)]">Employee</TableHead>}
                <TableHead className="font-mono text-xs text-[var(--text-muted)]">Status</TableHead>
                <TableHead className="font-mono text-xs text-[var(--text-muted)]">Time In/Out</TableHead>
                <TableHead className="font-mono text-xs text-[var(--text-muted)] text-right">Telemetry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-bold text-white text-sm">
                    {new Date(log.date).toLocaleDateString()}
                  </TableCell>
                  
                  {isAdmin && (
                    <TableCell className="text-xs font-mono text-[var(--ledger-blue)]">
                      {log.user?.name}
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${
                      log.status === 'Present' ? 'text-[var(--verify-green)] border-[var(--verify-green)]/30 bg-[var(--verify-green)]/10' :
                      log.status === 'Late' ? 'text-[var(--signal-amber)] border-[var(--signal-amber)]/30 bg-[var(--signal-amber)]/10' :
                      'text-[var(--alert-red)] border-[var(--alert-red)]/30 bg-[var(--alert-red)]/10'
                    }`}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1 text-[10px] font-mono text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Clock size={12}/> In: {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : '--'}</span>
                      <span className="flex items-center gap-1"><LogOut size={12}/> Out: {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : '--'}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      {log.lat && log.lng ? (
                        <div className="text-[9px] font-mono text-[var(--text-muted)] bg-black/40 px-2 py-1 rounded border border-white/5 inline-flex items-center gap-1">
                          <MapPin size={10} /> {log.lat.toFixed(3)}, {log.lng.toFixed(3)}
                        </div>
                      ) : (
                        <div className="text-[9px] font-mono text-[var(--text-muted)] bg-black/40 px-2 py-1 rounded border border-white/5 inline-flex items-center gap-1">
                          <MapPin size={10} /> Unknown Location
                        </div>
                      )}
                      
                      {log.anomaly && (
                        <div className="text-[9px] font-mono text-[var(--signal-amber)] bg-[var(--signal-amber)]/10 px-2 py-1 rounded border border-[var(--signal-amber)]/30 flex items-center gap-1">
                          <ShieldAlert size={10} /> {log.anomaly}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
