'use client';

import React, { useState } from 'react';
import { Briefcase, Plus, Building, Target, Users, Send, X, Phone, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';

interface RecruitmentIslandProps {
  initialJobs: any[];
}

const STATUS_COLUMNS = ['Applied', 'Interviewing', 'Offered'];

export default function RecruitmentIsland({ initialJobs }: RecruitmentIslandProps) {
  const [showAddJob, setShowAddJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('Engineering');
  const [jobLoc, setJobLoc] = useState('Remote');
  const [jobType, setJobType] = useState('Full-Time');
  const [jobSkills, setJobSkills] = useState('');

  const [localJobs, setLocalJobs] = useState<any[]>(initialJobs || []);

  React.useEffect(() => {
    setLocalJobs(initialJobs || []);
  }, [initialJobs]);

  const utils = trpc.useUtils();
  const createJob = trpc.recruitment.createJob.useMutation({
    onSuccess: () => {
      utils.recruitment.getJobs.invalidate();
      setShowAddJob(false);
      setJobTitle('');
      setJobSkills('');
    },
  });
  const updateCandidateStatus = trpc.recruitment.updateCandidateStatus.useMutation({
    onSuccess: () => utils.recruitment.getJobs.invalidate(),
    onError: () => setLocalJobs(initialJobs || []),
  });

  const handleDragStart = (e: React.DragEvent, candidateId: string, jobId: string) => {
    e.dataTransfer.setData('candidateId', candidateId);
    e.dataTransfer.setData('jobId', jobId);
  };

  const handleDrop = (e: React.DragEvent, jobId: string, newStatus: string) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    const sourceJobId = e.dataTransfer.getData('jobId');
    if (sourceJobId !== jobId || !candidateId) return;

    setLocalJobs((prev) => prev.map((job) => {
      if (job.id === jobId) {
        return {
          ...job,
          candidates: (job.candidates || []).map((cand: any) =>
            cand.id === candidateId ? { ...cand, status: newStatus } : cand
          ),
        };
      }
      return job;
    }));

    updateCandidateStatus.mutate({ candidateId, status: newStatus });
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = jobSkills.split(',').map((s) => s.trim()).filter(Boolean);
    createJob.mutate({
      title: jobTitle,
      department: jobDept,
      location: jobLoc,
      type: jobType,
      description: 'Auto-generated ATS description',
      requiredSkills: skillsArray.length > 0 ? JSON.stringify(skillsArray) : undefined,
    });
  };

  const jobList = localJobs || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setShowAddJob((v) => !v)}>
          {showAddJob ? <X size={16} /> : <><Plus size={16} /> Open New Req</>}
        </Button>
      </div>

      {showAddJob && (
        <Card className="border-[var(--emerald)]/30">
          <CardContent>
            <h3 className="mb-6 flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-xl font-extrabold uppercase tracking-wide text-[var(--text-main)]">
              <Briefcase size={24} className="text-[var(--emerald)]" /> Job Requisition Builder
            </h3>
            <form className="space-y-6" onSubmit={handleAddJob}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Job Title</label>
                  <Input type="text" required placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Department</label>
                  <select value={jobDept} onChange={(e) => setJobDept(e.target.value)} className="ledger-input flex h-10 w-full rounded-xl px-3 py-2 text-sm outline-none">
                    {['Engineering', 'Product', 'Human Resources', 'Sales'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Location Vector</label>
                  <select value={jobLoc} onChange={(e) => setJobLoc(e.target.value)} className="ledger-input flex h-10 w-full rounded-xl px-3 py-2 text-sm outline-none">
                    {['Remote', 'New York (Hybrid)', 'San Francisco (On-Site)'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Required Skills (Comma separated)</label>
                  <Input type="text" placeholder="e.g. React, Node.js, AWS" value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={createJob.isPending || !jobTitle}>
                <Send size={18} /> Publish Requisition
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {jobList.length === 0 ? (
          <EmptyState
            title="No Active Requisitions"
            description="Open a new requisition to start building your candidate pipeline."
            icon={<Briefcase className="h-5 w-5" />}
          />
        ) : (
          jobList.map((job: any) => {
            let reqSkills: string[] = [];
            try { if (job.requiredSkills) reqSkills = JSON.parse(job.requiredSkills); } catch { /* noop */ }

            return (
              <Card key={job.id} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="w-full border-b border-[var(--border-hairline)] bg-[var(--bg-hover)] p-8 lg:w-1/3 lg:border-b-0 lg:border-r">
                    <Badge variant="emerald" className="mb-4">Status: {job.status}</Badge>
                    <h3 className="mb-2 text-2xl font-extrabold leading-tight text-[var(--text-main)]">{job.title}</h3>
                    <div className="mb-6 space-y-2">
                      <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Building size={14} /> {job.department}</p>
                      <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Target size={14} /> {job.location}</p>
                    </div>
                    {reqSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reqSkills.map((skill) => (
                          <span key={skill} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-2 py-1 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-full p-8 lg:w-2/3">
                    <div className="mb-6 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">
                        <Users size={16} className="text-[var(--emerald)]" /> Pipeline Candidates
                      </h4>
                      <span className="rounded-full bg-[var(--bg-hover)] px-3 py-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        Count: {job.candidates?.length || 0}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {STATUS_COLUMNS.map((statusColumn) => (
                        <div
                          key={statusColumn}
                          className="flex min-h-[150px] flex-col gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, job.id, statusColumn)}
                        >
                          <h5 className="mb-2 border-b border-[var(--border-hairline)] pb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            {statusColumn}
                          </h5>
                          {(job.candidates || []).filter((c: any) => c.status === statusColumn || (statusColumn === 'Offered' && c.status === 'Hired')).map((cand: any) => (
                            <div
                              key={cand.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, cand.id, job.id)}
                              className="cursor-grab rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-3 transition-colors hover:border-[var(--emerald)]/30 active:cursor-grabbing"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h5 className="text-xs font-semibold text-[var(--text-main)]">{cand.name}</h5>
                                  <p className="mt-1 truncate text-[9px] text-[var(--text-muted)]">{cand.email}</p>
                                  {cand.phone && <p className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--text-muted)]"><Phone size={9} /> {cand.phone}</p>}
                                </div>
                                {cand.resumeUrl && (
                                  <a href={cand.resumeUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[var(--brand-strong)]" title="View CV">
                                    <FileText size={13} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
