"use client";

import React, { useState } from 'react';
import { Briefcase, Users, Plus, Target, Building, ShieldAlert, ArrowRight, X, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function RecruitmentPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const [showAddJob, setShowAddJob] = useState(false);
  
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("Engineering");
  const [jobLoc, setJobLoc] = useState("Remote");
  const [jobType, setJobType] = useState("Full-Time");
  const [jobSkills, setJobSkills] = useState("");

  const utils = trpc.useUtils();
  const { data: jobs, isLoading } = trpc.recruitment.getJobs.useQuery(undefined, { enabled: isAdmin });
  
  const [localJobs, setLocalJobs] = useState<any[]>([]);

  React.useEffect(() => {
    if (jobs) setLocalJobs(jobs);
  }, [jobs]);

  const updateCandidateStatus = trpc.recruitment.updateCandidateStatus.useMutation({
    onSuccess: () => utils.recruitment.getJobs.invalidate(),
    onError: () => { if (jobs) setLocalJobs(jobs); }
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

    // Optimistic UI Update
    setLocalJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          candidates: (job.candidates || []).map((cand: any) => 
            cand.id === candidateId ? { ...cand, status: newStatus } : cand
          )
        };
      }
      return job;
    }));

    // Trigger Mutation
    updateCandidateStatus.mutate({ candidateId, status: newStatus });
  };

  const createJob = trpc.recruitment.createJob.useMutation({
    onSuccess: () => {
      utils.recruitment.getJobs.invalidate();
      setShowAddJob(false);
      setJobTitle("");
      setJobSkills("");
    }
  });

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white uppercase tracking-widest">Access Denied</h2>
          <p className="text-[var(--text-muted)] text-sm font-mono">ATS Systems require HR Authorization Clearance.</p>
        </div>
      </div>
    );
  }

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = jobSkills.split(',').map(s => s.trim()).filter(Boolean);
    createJob.mutate({ 
      title: jobTitle, 
      department: jobDept, 
      location: jobLoc, 
      type: jobType, 
      description: "Auto-generated ATS description",
      requiredSkills: skillsArray.length > 0 ? JSON.stringify(skillsArray) : undefined
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Loading ATS Pipelines...</div>;
  }

  const jobList = localJobs || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Target className="text-emerald-400" size={36} />
            Applicant Tracking
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Manage active job requisitions and candidate pipelines.
          </p>
        </div>
        <button 
          onClick={() => setShowAddJob(!showAddJob)}
          className="mt-6 md:mt-0 bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
        >
          {showAddJob ? 'Cancel Req' : <><Plus size={16} /> Open New Req</>}
        </button>
      </div>

      {showAddJob && (
        <div className="bg-[#0a0a0a] border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <h3 className="font-mono text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4 mb-6 relative z-10">
            <Briefcase className="text-emerald-400" size={24} /> Job Requisition Builder
          </h3>

          <form className="space-y-6 relative z-10" onSubmit={handleAddJob}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Job Title</label>
                <input 
                  type="text" required placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-emerald-500 outline-none transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Department</label>
                <select 
                  value={jobDept} onChange={e => setJobDept(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-emerald-500 outline-none appearance-none transition-colors shadow-inner"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Location Vector</label>
                <select 
                  value={jobLoc} onChange={e => setJobLoc(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-emerald-500 outline-none appearance-none transition-colors shadow-inner"
                >
                  <option value="Remote">Remote</option>
                  <option value="New York (Hybrid)">New York (Hybrid)</option>
                  <option value="San Francisco (On-Site)">San Francisco (On-Site)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Required Skills (Comma separated)</label>
                <input 
                  type="text" placeholder="e.g. React, Node.js, AWS"
                  value={jobSkills} onChange={e => setJobSkills(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-emerald-500 outline-none transition-colors shadow-inner"
                />
              </div>
            </div>
            <button 
              disabled={createJob.isPending || !jobTitle} type="submit" 
              className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-black font-mono text-sm uppercase tracking-widest hover:brightness-110 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Send size={18} /> Publish Requisition
            </button>
          </form>
        </div>
      )}

      {/* Jobs Pipeline View */}
      <div className="space-y-8">
        {jobList.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
            <Briefcase size={64} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
            <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Active Requisitions.</h3>
          </div>
        ) : (
          jobList.map((job: any) => {
            let reqSkills: string[] = [];
            try { if (job.requiredSkills) reqSkills = JSON.parse(job.requiredSkills); } catch(e) {}
            
            return (
              <div key={job.id} className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
                
                {/* Job Info Column */}
                <div className="w-full lg:w-1/3 bg-black/40 p-8 border-b lg:border-b-0 lg:border-r border-white/10 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-transparent opacity-50" />
                  
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest border border-emerald-500/30 mb-4 inline-block">
                    Status: {job.status}
                  </span>
                  
                  <h3 className="text-2xl font-black text-white font-mono mb-2 leading-tight">{job.title}</h3>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
                      <Building size={14} /> {job.department}
                    </p>
                    <p className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
                      <Target size={14} /> {job.location}
                    </p>
                  </div>
                  
                  {reqSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {reqSkills.map(skill => (
                        <span key={skill} className="bg-white/10 text-white/70 px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest border border-white/5">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Candidate Pipeline Column */}
                <div className="w-full lg:w-2/3 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                      <Users size={16} className="text-emerald-400" /> Pipeline Candidates
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                      Count: {job.candidates?.length || 0}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['Applied', 'Interviewing', 'Offered'].map(statusColumn => (
                      <div 
                        key={statusColumn} 
                        className="bg-black/20 border border-white/5 rounded-xl p-3 min-h-[150px] flex flex-col gap-2"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, job.id, statusColumn)}
                      >
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-white/5 pb-2 mb-2">
                          {statusColumn}
                        </h5>
                        
                        {(job.candidates || []).filter((c: any) => c.status === statusColumn || (statusColumn === 'Offered' && c.status === 'Hired')).map((cand: any) => (
                          <div 
                            key={cand.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, cand.id, job.id)}
                            className="bg-black/60 border border-white/10 hover:border-emerald-500/30 transition-colors p-3 rounded-lg cursor-grab active:cursor-grabbing group"
                          >
                            <h5 className="font-bold text-white text-xs font-mono">{cand.name}</h5>
                            <p className="text-[9px] text-[var(--text-muted)] font-mono mt-1 truncate">{cand.email}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
