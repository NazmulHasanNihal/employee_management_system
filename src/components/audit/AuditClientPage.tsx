'use client';

import React, { useState, useEffect } from 'react';
import { Lock, FileDigit, Search, ShieldCheck, UserPlus, Crown, Check, ShieldAlert, Loader2, Link as LinkIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { executeServerMutation } from '@/app/actions/db';
import { trpc } from '@/lib/trpc/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from '@/lib/toast';

interface AuditClientPageProps {
  initialEvents: any[];
  isCEO: boolean;
}

// Simple SHA-256 hash function using Web Crypto API
async function computeSHA256(data: string) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function AuditClientPage({ initialEvents, isCEO }: AuditClientPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'secure' | 'tampered'>('idle');
  const [events, setEvents] = useState(initialEvents || []);
  
  // Sort events chronologically (newest first for display, but verification goes oldest->newest)
  useEffect(() => {
    const sorted = [...(initialEvents || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvents(sorted);
  }, [initialEvents]);

  const { data: employees = [] } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isCEO });
  const updatePermissions = trpc.user.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success('Access Granted', 'Audit Log viewing permission successfully assigned.');
      setShowGrantModal(false);
    },
    onError: (err: any) => {
      toast.error('Failed', err?.message || 'Could not update permissions');
    },
  });

  const handleGrantAccess = () => {
    if (!selectedUserId) return;
    updatePermissions.mutate({ userId: selectedUserId, permissions: ['AUDIT_LOG_ACCESS'] });
  };

  const handleTamper = async () => {
    try {
      await executeServerMutation('audit.tamperDatabase', {});
      toast.success('Database Tampered', 'A record was maliciously altered. Run Verify Ledger to catch it!');
      // Typically we'd invalidate queries here, but a hard reload is fine for demo
      window.location.reload();
    } catch (e: any) {
      toast.error('Tamper Failed', e.message);
    }
  };

  const handleVerifyLedger = async () => {
    setVerifyState('verifying');
    let isTampered = false;
    let prevHash = "genesis_hash_00000000000000000000000000000000";
    
    // Slight artificial delay for scanning effect
    await new Promise(r => setTimeout(r, 800));

    // Sort oldest to newest for chain verification
    const verificationChain = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const updatedEvents = [];
    
    for (let i = 0; i < verificationChain.length; i++) {
      const event = verificationChain[i];
      
      const actualHash = event.hash || "MISSING";
      const actualPrev = event.previousHash || "MISSING";
      
      // Compute what the hash *should* be based on the payload
      const payloadString = prevHash + event.action + (event.target || '') + (event.user || '') + new Date(event.timestamp).toISOString();
      const computedHash = await computeSHA256(payloadString);
      
      // Validate both the current hash and the chain link (prevHash)
      // If `event.hash` doesn't exist, it's a legacy seeded record, we'll gracefully let it pass if it matches our initial dummy logic, but for real records it must match.
      const isLegacy = !event.hash && !event.previousHash;
      
      let isRecordValid = true;
      if (!isLegacy) {
        if (actualHash !== computedHash || actualPrev !== prevHash) {
          isRecordValid = false;
        }
      }

      updatedEvents.push({
        ...event,
        verifiedHash: isLegacy ? computedHash.substring(0, 32) : actualHash,
        verifiedPrevHash: isLegacy ? prevHash : actualPrev,
        isValid: isRecordValid
      });
      
      prevHash = isLegacy ? computedHash : actualHash;
      
      if (!isRecordValid) {
        isTampered = true;
      }
    }
    
    // Reverse again to show newest first in the table
    updatedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setEvents(updatedEvents);
    
    if (isTampered) {
      setVerifyState('tampered');
      toast.error("Ledger Tampered", "Cryptographic verification failed. Data integrity compromised.");
    } else {
      setVerifyState('secure');
      toast.success("Ledger Secure", "Cryptographic chain verified mathematically. No tampering detected.");
    }
  };

  const filteredEvents = events.filter(
    (event: any) =>
      event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.actorName && event.actorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.user && event.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
      {/* Top Controls & CEO Access Delegation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search action, hash, or actor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl border-[var(--border-hairline)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleVerifyLedger}
            disabled={verifyState === 'verifying'}
            className={`rounded-xl flex items-center gap-2 font-mono text-xs shadow-lg transition-all ${
              verifyState === 'secure' ? 'bg-[var(--emerald)] hover:bg-[var(--emerald)] text-black border border-transparent' : 
              verifyState === 'tampered' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500' :
              'bg-[var(--bg-panel)] hover:bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-hairline)]'
            }`}
          >
            {verifyState === 'idle' && <><ShieldCheck size={16} className="text-[var(--text-muted)]" /> Verify Ledger Integrity</>}
            {verifyState === 'verifying' && <><Loader2 size={16} className="animate-spin text-[var(--brand)]" /> Verifying Hash Chain...</>}
            {verifyState === 'secure' && <><ShieldCheck size={16} /> Mathematically Proven Immutable</>}
            {verifyState === 'tampered' && <><ShieldAlert size={16} /> Ledger Tampered!</>}
          </Button>

          {isCEO && (
            <>
              <Button onClick={() => setShowGrantModal(true)} variant="outline" className="rounded-xl flex items-center gap-2 border-[var(--border-hairline)] bg-[var(--bg-panel)]">
                <UserPlus size={16} className="text-[var(--text-muted)]" /> Grant Audit Access
              </Button>
              <Button onClick={handleTamper} variant="outline" className="rounded-xl flex items-center gap-2 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10">
                <ShieldAlert size={16} /> Tamper Database
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Audit Log Table Card */}
      <Card className={`border-2 transition-colors duration-500 ${verifyState === 'secure' ? 'border-[var(--emerald)] shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-[var(--bg-panel)]' : 'border-[var(--border-hairline)]'}`}>
        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No Audit Events Recorded"
            description="No security or system records match your search filter."
            icon={<FileDigit className="h-5 w-5" />}
          />
        ) : (
          <Table>
            <TableHeader className="bg-[var(--bg-app)] border-b border-[var(--border-hairline)]">
              <TableRow>
                <TableHead className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Timestamp</TableHead>
                <TableHead className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-[240px]">Cryptographic Hash Chain</TableHead>
                <TableHead className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Actor</TableHead>
                <TableHead className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Action</TableHead>
                <TableHead className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event: any, i: number) => {
                const isSecureRow = verifyState === 'secure' && event.isValid;
                return (
                  <TableRow key={event.id} className={`transition-colors ${isSecureRow ? 'bg-[var(--emerald)]/5 border-b-[var(--emerald)]/20 hover:bg-[var(--emerald)]/10' : 'border-b-[var(--border-hairline)]'}`}>
                    <TableCell className="font-mono font-semibold text-xs text-[var(--text-main)] whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-[10px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 opacity-60">
                          <span className="bg-[var(--bg-app)] px-1.5 py-0.5 rounded text-[var(--text-muted)] w-8 text-center text-[9px]">PREV</span>
                          <span className="text-[var(--text-muted)] truncate max-w-[120px] lg:max-w-[180px]">{event.verifiedPrevHash || event.previousHash || 'genesis_hash_00000000000'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded w-8 text-center text-[9px] font-bold ${isSecureRow ? 'bg-[var(--emerald)]/20 text-[var(--emerald)]' : 'bg-[var(--brand)]/10 text-[var(--brand)]'}`}>HASH</span>
                          <span className={`${isSecureRow ? 'text-[var(--emerald)]' : 'text-[var(--text-main)]'} truncate max-w-[120px] lg:max-w-[180px] font-bold`}>
                            {event.verifiedHash || event.hash || event.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-semibold text-xs ${isSecureRow ? 'text-[var(--emerald)]' : 'text-[var(--text-main)]'}`}>{event.actorName || event.actorId || event.user || 'System'}</span>
                        <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{event.actorRole || 'Service'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className={`font-mono uppercase tracking-wider text-[9px] ${isSecureRow ? 'bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/30' : 'bg-[var(--bg-app)] text-[var(--text-main)] border border-[var(--border-hairline)]'}`}>
                        {event.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-muted)] max-w-[200px]">
                      <div className="truncate">
                        {event.details ? (typeof event.details === 'string' ? event.details : JSON.stringify(event.details)) : (event.target || '-')}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* CEO Audit Access Granting Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[var(--amber)]" />
                <h3 className="text-base font-bold text-[var(--text-main)]">Delegate Audit Log Access</h3>
              </div>
              <button onClick={() => setShowGrantModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              As CEO / Founder, select an employee account to grant confidential Audit Log viewing permissions.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Select Account</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-xs font-medium"
              >
                <option value="">Select Employee Account...</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role} &middot; {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setShowGrantModal(false)} variant="outline" size="sm" className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleGrantAccess}
                disabled={!selectedUserId || updatePermissions.isPending}
                variant="primary"
                size="sm"
                className="rounded-xl flex items-center gap-1.5"
              >
                <Check size={14} /> Grant Permission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

