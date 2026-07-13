"use client";

import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import usePartySocket from '@/lib/usePartySocket';
import posthog from 'posthog-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function LeaveRequestForm() {
  const utils = trpc.useUtils();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Vacation');
  const [reason, setReason] = useState('');

  const socket = usePartySocket({
    host: 'localhost:1999',
    room: 'ems-global',
  });

  const requestMutation = trpc.leave.requestLeave.useMutation({
    onSuccess: () => {
      setStartDate(''); setEndDate(''); setReason('');
      utils.leave.getRequests.invalidate();
      socket.send(JSON.stringify({ type: 'leave_update' }));
      socket.send(JSON.stringify({ type: 'notification_update' }));
      posthog.capture('leave_request_submitted', {
        leave_type: type,
      });
    }
  });

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl h-fit sticky top-6">
      <CardHeader>
        <CardTitle className="font-mono text-xs font-bold text-white uppercase tracking-widest">
          Request Time Off
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Leave Type</Label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] appearance-none"
          >
            <option value="Vacation">Vacation</option>
            <option value="Sick">Sick</option>
            <option value="Personal">Personal</option>
            <option value="Maternity/Paternity">Maternity/Paternity</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Start Date</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="bg-black/40 border-white/10 text-white focus:border-[var(--ledger-blue)] [color-scheme:dark]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">End Date</Label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="bg-black/40 border-white/10 text-white focus:border-[var(--ledger-blue)] [color-scheme:dark]"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Reason (Optional)</Label>
          <textarea 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-sans text-white focus:border-[var(--ledger-blue)] custom-scrollbar"
            placeholder="Going to Hawaii..."
          />
        </div>
        
        <Button 
          disabled={requestMutation.isPending || !startDate || !endDate}
          onClick={() => requestMutation.mutate({ startDate, endDate, type, reason })}
          className="w-full bg-[var(--ledger-blue)] text-black py-6 mt-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-[var(--ledger-blue)] hover:shadow-[0_0_15px_var(--ledger-blue)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {requestMutation.isPending ? <Activity size={16} className="animate-spin" /> : 'SUBMIT REQUEST'}
        </Button>
      </CardContent>
    </Card>
  );
}
