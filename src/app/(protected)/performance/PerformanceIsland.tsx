'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, Clock, Award, Star, UserCheck, X, TrendingUp, Target, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

interface Objective {
  id: string;
  title: string;
  status: string;
  progress: number;
}

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
  avatarUrl: string | null;
  role: string;
}

interface PerformanceIslandProps {
  initialObjectives: Objective[];
  employees?: EmployeeOption[];
  isPrivileged?: boolean;
}

const COMPETENCIES = [
  { name: 'Technical Execution & Velocity', score: '4.9 / 5.0', pct: 98, tone: 'text-[var(--emerald)] bg-[var(--emerald)]/20' },
  { name: 'Leadership & Collaboration', score: '4.8 / 5.0', pct: 96, tone: 'text-[var(--brand)] bg-[var(--brand)]/20' },
  { name: 'Problem Solving & Innovation', score: '4.7 / 5.0', pct: 94, tone: 'text-[var(--sky)] bg-[var(--sky)]/20' },
  { name: 'Quality & Timely Delivery', score: '5.0 / 5.0', pct: 100, tone: 'text-[var(--emerald)] bg-[var(--emerald)]/20' },
];

export default function PerformanceIsland({ initialObjectives, employees = [], isPrivileged = false }: PerformanceIslandProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review Form State
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('Q1 2026');
  const [rating, setRating] = useState('Exceeds Expectations');
  const [comments, setComments] = useState('');

  const utils = trpc.useUtils();

  const createObj = trpc.performance.createObjective.useMutation({
    onSuccess: () => {
      utils.performance.getObjectives.invalidate();
      setNewTitle('');
      toast.success('Objective Created', 'New performance OKR objective added.');
    },
  });

  const updateObj = trpc.performance.updateObjectiveProgress.useMutation({
    onSuccess: () => utils.performance.getObjectives.invalidate(),
  });

  const submitReviewMutation = trpc.performance.submitReview.useMutation({
    onSuccess: () => {
      utils.performance.getReviews.invalidate();
      setIsReviewModalOpen(false);
      setComments('');
      toast.success('Performance Evaluation Recorded', 'Feedback saved and employee notified.');
    },
    onError: (err: any) => {
      toast.error('Submission Error', err?.message || 'Failed to submit review');
    },
  });

  const { data: objectivesData } = trpc.performance.getObjectives.useQuery(undefined, {
    initialData: initialObjectives,
  });
  const objectives = objectivesData || initialObjectives;

  const completedCount = (objectives as any[]).filter((o: any) => o.progress >= 100 || o.status === 'Completed').length;
  const avgProgress = (objectives as any[]).length > 0 ? Math.round((objectives as any[]).reduce((sum: number, o: any) => sum + (o.progress || 0), 0) / objectives.length) : 88;

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createObj.mutate({ title: newTitle });
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      toast.error('Validation Error', 'Please select an employee');
      return;
    }
    if (!comments.trim()) {
      toast.error('Validation Error', 'Please enter evaluation feedback comments');
      return;
    }

    submitReviewMutation.mutate({
      targetUserId: selectedEmpId,
      reviewPeriod,
      rating,
      comments,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Performance Rating</p>
              <p className="text-3xl font-extrabold text-[var(--emerald)]">4.9 / 5.0</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Exceeds Expectations</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <Star size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-strong)]">Goal Completion Rate</p>
              <p className="text-3xl font-extrabold text-[var(--text-main)] font-mono">{avgProgress}%</p>
              <p className="text-[10px] text-[var(--brand-strong)] mt-0.5">{completedCount} of {objectives.length} OKRs Achieved</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/20 text-[var(--brand-strong)]">
              <Target size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--sky)]/30 bg-[var(--sky-soft)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--sky)]">Key Competencies</p>
              <p className="text-3xl font-extrabold text-[var(--text-main)] font-mono">96%</p>
              <p className="text-[10px] text-[var(--sky)] mt-0.5">Top 5% Company Percentile</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sky)]/20 text-[var(--sky)]">
              <Award size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Competency Radar & OKR Objectives */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Competencies breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-[var(--brand-strong)]" /> 360° Core Competencies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {COMPETENCIES.map((c) => (
              <div key={c.name} className="space-y-1.5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-main)] truncate max-w-[12rem]">{c.name}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${c.tone}`}>{c.score}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
                  <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* OKRs & Objectives */}
        <Card className="lg:col-span-2 space-y-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--brand-strong)]" /> Key Objectives &amp; OKRs
              </div>
              {isPrivileged && (
                <Button variant="primary" size="sm" onClick={() => setIsReviewModalOpen(true)}>
                  <UserCheck size={14} className="mr-1" /> Record Evaluation
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddObjective} className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add new objective or key result..."
                className="flex-1"
              />
              <Button type="submit" disabled={createObj.isPending || !newTitle.trim()}>
                <Plus size={16} /> Add OKR
              </Button>
            </form>

            <div className="space-y-3">
              {(objectives as any[]).map((obj: any) => (
                <div key={obj.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-main)] truncate">{obj.title}</span>
                    <Badge variant={obj.progress >= 100 ? 'emerald' : 'sky'}>
                      {obj.progress >= 100 ? 'Completed' : `${obj.progress}%`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={obj.progress || 0}
                      onChange={(e) => updateObj.mutate({ id: obj.id, progress: Number(e.target.value) })}
                      className="h-2 flex-1 cursor-pointer accent-[var(--brand)]"
                    />
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)] w-10 text-right">{obj.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-main)]">Submit Performance Review</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Select Employee</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Choose Employee —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.designation || e.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Review Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Outstanding">Outstanding (5/5)</option>
                  <option value="Exceeds Expectations">Exceeds Expectations (4/5)</option>
                  <option value="Meets Expectations">Meets Expectations (3/5)</option>
                  <option value="Needs Improvement">Needs Improvement (2/5)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Evaluation Comments &amp; Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Detailed constructive feedback and performance summary..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitReviewMutation.isPending}>
                  {submitReviewMutation.isPending ? 'Saving Evaluation…' : 'Record Evaluation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
