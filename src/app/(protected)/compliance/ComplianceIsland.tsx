'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, Clock, EyeOff, Award, AlertTriangle, ShieldAlert } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { T } from "@/components/Translate";

interface ComplianceIslandProps {
  isAdmin: boolean;
  initialMyCerts: { id: string; name: string; expiryDate: Date; userId: string; createdAt: Date }[];
  initialExpiringCerts: { id: string; name: string; expiryDate: Date; userId: string; createdAt: Date; user?: { name: string; department: string | null } }[];
  initialWhistleblower: { id: string; report: string; userId: string | null; status: string; assignedTo: string | null; resolution: string | null; createdAt: Date; updatedAt: Date }[];
}

type Tab = 'CERTS' | 'WHISTLEBLOWER';

export default function ComplianceIsland({ isAdmin, initialMyCerts, initialExpiringCerts, initialWhistleblower }: ComplianceIslandProps) {
  const [activeTab, setActiveTab] = useState<Tab>('CERTS');
  const [newCert, setNewCert] = useState({ name: '', expiryDate: '' });
  const [reportText, setReportText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const utils = trpc.useUtils();
  // Live lists (seeded with server props) so actions refresh in place.
  const { data: myCertsData } = trpc.compliance.getMyCertifications.useQuery(undefined, { initialData: initialMyCerts });
  const myCerts = (myCertsData as { id: string; name: string; expiryDate: Date; userId: string; createdAt: Date }[] | undefined) ?? initialMyCerts ?? [];
  const { data: expiringData } = trpc.compliance.getExpiringCertifications.useQuery(undefined, { initialData: initialExpiringCerts });
  const expiringCerts = (expiringData as { id: string; name: string; expiryDate: Date; userId: string; createdAt: Date; user?: { name: string; department: string | null } }[] | undefined) ?? initialExpiringCerts ?? [];
  const { data: wbData } = trpc.compliance.getWhistleblowerReports.useQuery(undefined, { initialData: initialWhistleblower, enabled: isAdmin });
  const whistleblower = (wbData as { id: string; report: string; userId: string | null; status: string; assignedTo: string | null; resolution: string | null; createdAt: Date; updatedAt: Date }[] | undefined) ?? initialWhistleblower ?? [];

  const addCert = trpc.compliance.addCertification.useMutation({
    onSuccess: () => {
      utils.compliance.getMyCertifications.invalidate();
      setNewCert({ name: '', expiryDate: '' });
    },
  });
  const submitReport = trpc.compliance.submitWhistleblower.useMutation({
    onSuccess: () => {
      utils.compliance.getWhistleblowerReports.invalidate();
      setReportText('');
      setReportSubmitted(true);
      setTimeout(() => setReportSubmitted(false), 4000);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex gap-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-1 self-start w-fit">
        <button
          onClick={() => setActiveTab('CERTS')}
          className={`rounded-lg px-6 py-3 text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'CERTS' ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          {/* @ts-ignore */}<T>Certifications</T></button>
        <button
          onClick={() => setActiveTab('WHISTLEBLOWER')}
          className={`flex items-center gap-2 rounded-lg px-6 py-3 text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'WHISTLEBLOWER' ? 'bg-[var(--rose)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          <EyeOff size={14} /> {/* @ts-ignore */}<T>Whistleblower</T></button>
      </div>

      {activeTab === 'CERTS' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-sm font-semibold text-[var(--text-main)]">
              <Award size={16} className="text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>My Compliance Portfolio</T></h3>

            <Card>
              <CardContent>
                <form className="mb-8 space-y-4" onSubmit={(e) => { e.preventDefault(); addCert.mutate(newCert); }}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input type="text" required placeholder="Certification Title" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} />
                    <Input type="date" required value={newCert.expiryDate} onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })} />
                  </div>
                  <Button type="submit" variant="primary" className="w-full" disabled={addCert.isPending || !newCert.name || !newCert.expiryDate}>
                    {/* @ts-ignore */}<T>Register Certification</T></Button>
                </form>

                {(!myCerts || myCerts.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)]/50 p-8 text-center text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {/* @ts-ignore */}<T>No active certifications.</T></div>
                ) : (
                  <div className="space-y-3">
                    {myCerts.map((cert: { id: string; name: string; expiryDate: Date }) => {
                      const daysLeft = Math.ceil((new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                      const isExpiring = daysLeft <= 30;
                      return (
                        <div key={cert.id} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-main)]">{cert.name}</p>
                            <p className={`mt-1 text-[10px] uppercase tracking-wide ${isExpiring ? 'text-[var(--rose)]' : 'text-[var(--text-muted)]'}`}>
                              {/* @ts-ignore */}<T>Exp:</T>{new Date(cert.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <ShieldCheck size={20} className={isExpiring ? 'animate-pulse text-[var(--rose)]' : 'text-[var(--emerald)]'} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isAdmin && (
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-sm font-semibold uppercase tracking-wide text-[var(--rose)]">
                <AlertTriangle size={16} /> {/* @ts-ignore */}<T>Audit: Expiring Soon (&lt; 30 Days)</T></h3>

              <Card className="border-[var(--rose)]/30">
                <CardContent>
                  {(!expiringCerts || expiringCerts.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[10px] uppercase tracking-wide text-[var(--emerald)]">
                      <CheckCircle size={32} className="mb-3 opacity-50" />
                      {/* @ts-ignore */}<T>All Personnel Fully Compliant.</T></div>
                  ) : (
                    <div className="space-y-4">
                        {expiringCerts.map((cert: { id: string; name: string; expiryDate: Date; user?: { name: string; department: string | null } }) => (
                         <div key={cert.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] p-4">
                           <div className="flex-1">
                             <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                               {cert.user?.name}
                               <Badge variant="rose">{/* @ts-ignore */}<T>Critical</T></Badge>
                             </h4>
                            <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{cert.name}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="mb-1 flex items-center justify-end gap-1 text-[9px] uppercase tracking-wide text-[var(--rose)]">
                              <Clock size={10} /> {/* @ts-ignore */}<T>Deadline</T></p>
                            <p className="text-xs font-bold text-[var(--text-main)]">{new Date(cert.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'WHISTLEBLOWER' && (
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-[var(--rose)]/40">
            <CardContent>
              <div className="mb-6 flex items-center gap-4 border-b border-[var(--rose)]/30 pb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--rose)]/50 bg-[var(--rose-soft)]">
                  <EyeOff size={32} className="text-[var(--rose)]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold uppercase tracking-wide text-[var(--rose)]">{/* @ts-ignore */}<T>Confidential Disclosure</T></h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    {/* @ts-ignore */}<T>Submissions are cryptographically decoupled from your session. IP addresses are not logged. Reports route directly to the Ethics Committee.</T></p>
                </div>
              </div>

              {reportSubmitted ? (
                <div className="py-16 text-center">
                  <ShieldCheck size={64} className="mx-auto mb-6 opacity-80 text-[var(--rose)]" />
                   <h4 className="mb-2 text-fluid-2xl font-extrabold uppercase tracking-wide text-[var(--text-main)]">{/* @ts-ignore */}<T>Transmission Secure</T></h4>
                  <p className="text-sm text-[var(--text-muted)]">{/* @ts-ignore */}<T>Your disclosure has been encrypted and successfully routed.</T></p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); submitReport.mutate({ report: reportText }); }}>
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      <ShieldAlert size={12} className="text-[var(--rose)]" /> {/* @ts-ignore */}<T>Secure Input Area</T></label>
                    <textarea
                      required
                      rows={6}
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Provide detailed, factual information regarding the integrity violation..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex w-full rounded-xl p-5 text-sm outline-none resize-none"
                    />
                  </div>
                  <Button type="submit" variant="danger" className="w-full" disabled={submitReport.isPending || !reportText.trim()}>
                    <EyeOff size={16} /> {/* @ts-ignore */}<T>Execute Anonymous Transmission</T></Button>
                </form>
              )}
            </CardContent>
          </Card>

          {isAdmin && whistleblower.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">{/* @ts-ignore */}<T>Received Reports</T></h3>
              {whistleblower.map((r: { id: string; report: string; createdAt: Date; status: string }) => (
                <div key={r.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
                  <p className="text-sm text-[var(--text-main)]">{r.report}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleDateString()} — {r.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
