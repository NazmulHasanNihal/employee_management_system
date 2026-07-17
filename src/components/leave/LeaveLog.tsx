"use client";

import React from 'react';
import { Calendar, CalendarPlus, Check, Clock, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import useRealtimePresence from '@/lib/useRealtimePresence';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '../StatusBadge';
import { EmptyState } from '../EmptyState';

interface LeaveLogProps {
  requests: any[];
  isAdmin: boolean;
  currentUser: any;
}

export function LeaveLog({ requests, isAdmin, currentUser }: LeaveLogProps) {
  const utils = trpc.useUtils();
  const socket = useRealtimePresence({
    room: 'ems-global',
  });

  const updateMutation = trpc.leave.updateStatus.useMutation({
    onSuccess: () => {
      utils.leave.getRequests.invalidate();
      socket.send(JSON.stringify({ type: 'leave_update' }));
      socket.send(JSON.stringify({ type: 'notification_update' }));
    }
  });

  const upcomingLeave = requests?.filter(r => new Date(r.startDate) >= new Date() && r.status === 'Approved') || [];

  const exportToICS = (req: any) => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    end.setDate(end.getDate() + 1); // ICS end dates are exclusive

    const formatICSDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EMS Core//Leave Management//EN',
      'BEGIN:VEVENT',
      `UID:${req.id}@emscore`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${formatICSDate(start)}`,
      `DTEND;VALUE=DATE:${formatICSDate(end)}`,
      `SUMMARY:${req.type} Leave - ${req.user?.name || currentUser?.name}`,
      `DESCRIPTION:${req.reason || 'Approved leave period.'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave-${req.type.toLowerCase()}-${formatICSDate(start)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[var(--verify-green)]" /> Upcoming Approved Leave
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingLeave.map(req => (
            <div key={req.id} className="bg-[var(--verify-green)]/5 border border-[var(--verify-green)]/20 rounded-2xl p-4 relative group">
              <h4 className="font-bold text-white text-sm mb-1">{req.user?.name || currentUser?.name}</h4>
              <div className="text-xs font-mono text-[var(--verify-green)] flex items-center gap-1 mb-3">
                <Calendar size={12} /> {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
              </div>
              <Button 
                onClick={() => exportToICS(req)}
                variant="outline"
                className="w-full bg-[var(--verify-green)]/10 text-[var(--verify-green)] hover:bg-[var(--verify-green)] hover:text-black border-[var(--verify-green)]/30 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <CalendarPlus size={14} /> Add to Calendar
              </Button>
            </div>
          ))}
          {upcomingLeave.length === 0 && (
            <div className="col-span-full py-8 text-center border border-dashed border-white/10 rounded-2xl text-[10px] font-mono text-[var(--text-muted)] uppercase">
              No upcoming approved leave
            </div>
          )}
        </div>
      </div>

      <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest pt-4 mb-4">Request Log</h3>
      <div className="space-y-3">
        {requests?.map(req => (
          <div key={req.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold text-white text-sm">
                  {req.type}
                </h4>
                <StatusBadge status={req.status.toUpperCase() as any} />
              </div>
              {isAdmin && <p className="text-xs font-mono text-[var(--ledger-blue)] mb-1">{req.user?.name}</p>}
              <p className="text-[10px] font-mono text-[var(--text-muted)]">
                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {req.status === 'Approved' && (
                <Button 
                  onClick={() => exportToICS(req)}
                  variant="outline"
                  size="sm"
                  className="bg-black/40 text-[var(--text-muted)] hover:text-white border-white/10 text-[10px] font-mono uppercase transition-colors flex items-center gap-1"
                >
                  <CalendarPlus size={12} /> Sync
                </Button>
              )}
              {isAdmin && req.status === 'Pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: req.id, status: 'Approved' })} className="bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30 hover:bg-[var(--verify-green)] hover:text-black transition-colors flex items-center gap-1 text-[10px] font-mono font-bold uppercase">
                    <Check size={12} /> Approve
                  </Button>
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: req.id, status: 'Rejected' })} className="bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]/30 hover:bg-[var(--alert-red)] hover:text-black transition-colors flex items-center gap-1 text-[10px] font-mono font-bold uppercase">
                    <X size={12} /> Deny
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(!requests || requests.length === 0) && (
          <EmptyState 
            title="No Leave Requests Found" 
            description="You don't have any leave or PTO requests on file." 
          />
        )}
      </div>
    </div>
  );
}
