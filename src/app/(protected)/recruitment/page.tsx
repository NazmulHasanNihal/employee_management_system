"use client";

import React, { useState } from 'react';
import { Briefcase, UserPlus, Users, MapPin, Plus, Building } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { InternalMatches } from '@/components/recruitment/InternalMatches';
import posthog from 'posthog-js';

export default function RecruitmentPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState<string | null>(null);

  // New Job State
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("Engineering");
  const [jobLoc, setJobLoc] = useState("Remote");
  const [jobType, setJobType] = useState("Full-Time");
  const [jobDesc, setJobDesc] = useState("");
  const [jobSkills, setJobSkills] = useState("");

  // New Candidate State
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candNotes, setCandNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: jobs, isLoading } = trpc.recruitment.getJobs.useQuery(undefined, { enabled: isAdmin });

  const createJob = trpc.recruitment.createJob.useMutation({
    onSuccess: (_, variables) => {
      utils.recruitment.getJobs.invalidate();
      posthog.capture('job_posted', {
        department: variables.department,
        location: variables.location,
        job_type: variables.type,
      });
      setShowAddJob(false);
      setJobTitle("");
      setJobDesc("");
      setJobSkills("");
    }
  });

  const addCandidate = trpc.recruitment.addCandidate.useMutation({
    onSuccess: () => {
      utils.recruitment.getJobs.invalidate();
      posthog.capture('candidate_added');
      setShowAddCandidate(null);
      setCandName("");
      setCandEmail("");
      setCandNotes("");
    }
  });

  const updateCandidate = trpc.recruitment.updateCandidateStatus.useMutation({
    onSuccess: (_, variables) => {
      utils.recruitment.getJobs.invalidate();
      posthog.capture('candidate_status_updated', {
        new_status: variables.status,
      });
    }
  });

  if (!isAdmin) {
    return <div className="text-center p-8 text-white">Unauthorized. HR and Admins only.</div>;
  }

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = jobSkills.split(',').map(s => s.trim()).filter(Boolean);
    createJob.mutate({ 
      title: jobTitle, 
      department: jobDept, 
      location: jobLoc, 
      type: jobType, 
      description: jobDesc,
      requiredSkills: skillsArray.length > 0 ? JSON.stringify(skillsArray) : undefined
    });
  };

  const handleAddCandidate = (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    addCandidate.mutate({ jobPostingId: jobId, name: candName, email: candEmail, notes: candNotes });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-teal-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-teal-400 to-emerald-200 text-transparent bg-clip-text flex items-center gap-3">
            <Briefcase className="text-teal-400" size={32} />
            Recruitment ATS
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Manage job postings and track candidates.
          </p>
        </div>
        <button 
          onClick={() => setShowAddJob(!showAddJob)}
          className="mt-4 md:mt-0 bg-teal-500 text-black px-4 py-2 rounded-lg font-bold font-mono uppercase tracking-widest hover:brightness-110 flex items-center gap-2"
        >
          <Plus size={16} /> Post Job
        </button>
      </div>

      {showAddJob && (
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl">
          <form onSubmit={handleAddJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Job Title</label>
                <input required type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Department</label>
                <input required type="text" value={jobDept} onChange={(e) => setJobDept(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Location</label>
                <input required type="text" value={jobLoc} onChange={(e) => setJobLoc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Type</label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 focus:outline-none">
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Required Skills (Comma separated)</label>
                <input type="text" value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} placeholder="e.g. React, Node.js, Typescript" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Description</label>
              <textarea required rows={3} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddJob(false)} className="px-4 py-2 text-[var(--text-muted)]">Cancel</button>
              <button type="submit" disabled={createJob.isPending} className="bg-teal-500 text-black px-6 py-2 rounded-lg font-bold">Post Job</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm animate-pulse">Loading ATS...</div>
      ) : (
        <div className="space-y-6">
          {jobs?.map((job: any) => (
            <div key={job.id} className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {job.title}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-teal-500/30 text-teal-400 bg-teal-500/10">
                      {job.status}
                    </span>
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs font-mono text-[var(--text-muted)] uppercase">
                    <span className="flex items-center gap-1"><Building size={12}/> {job.department}</span>
                    <span className="flex items-center gap-1"><MapPin size={12}/> {job.location}</span>
                    <span className="flex items-center gap-1"><Users size={12}/> {job.candidates.length} Candidates</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddCandidate(showAddCandidate === job.id ? null : job.id)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-2 text-sm text-white transition-colors"
                >
                  <UserPlus size={14} /> Add Candidate
                </button>
              </div>

              {showAddCandidate === job.id && (
                <div className="p-4 bg-black/40 rounded-xl border border-white/10 mb-6">
                  <form onSubmit={(e) => handleAddCandidate(e, job.id)} className="flex gap-2 items-start">
                    <input required type="text" placeholder="Name" value={candName} onChange={(e) => setCandName(e.target.value)} className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
                    <input required type="email" placeholder="Email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
                    <input type="text" placeholder="Notes (optional)" value={candNotes} onChange={(e) => setCandNotes(e.target.value)} className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none" />
                    <button type="submit" disabled={addCandidate.isPending} className="bg-teal-500 text-black px-4 py-2 rounded font-bold text-sm">Add</button>
                  </form>
                </div>
              )}

              {/* Kanban-lite candidates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['New', 'Interviewing', 'Hired', 'Rejected'].map(status => (
                  <div key={status} className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <h4 className="text-xs font-mono uppercase text-[var(--text-muted)] mb-3 pb-2 border-b border-white/10 flex justify-between">
                      {status}
                      <span className="text-white bg-white/10 px-1.5 rounded">{job.candidates.filter((c: any) => c.status === status).length}</span>
                    </h4>
                    <div className="space-y-2">
                      {job.candidates.filter((c: any) => c.status === status).map((cand: any) => (
                        <div key={cand.id} className="p-2 bg-white/5 rounded border border-white/10 text-sm">
                          <div className="font-bold text-white mb-1">{cand.name}</div>
                          <div className="text-xs text-[var(--text-muted)] truncate mb-2">{cand.email}</div>
                          <select 
                            value={cand.status}
                            onChange={(e) => updateCandidate.mutate({ id: cand.id, status: e.target.value })}
                            className="w-full text-xs font-mono bg-black/50 border border-white/10 rounded px-1 py-1 text-white"
                          >
                            <option value="New">Move to: New</option>
                            <option value="Interviewing">Move to: Interviewing</option>
                            <option value="Hired">Move to: Hired</option>
                            <option value="Rejected">Move to: Rejected</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <InternalMatches jobId={job.id} />
            </div>
          ))}
          {jobs?.length === 0 && (
            <div className="text-center text-[var(--text-muted)] py-12 font-mono text-sm border border-dashed border-white/10 rounded-2xl bg-white/5">
              No active job postings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
