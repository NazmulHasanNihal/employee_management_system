'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, Clock, Award, Star, UserCheck, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';

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
    onSuccess: () => utils.performance.getObjectives.invalidate(),
  });

  const updateObj = trpc.performance.updateObjectiveProgress.useMutation({
    onSuccess: () => utils.performance.getObjectives.invalidate(),
  });

  const submitReviewMutation = trpc.performance.submitReview.useMutation({
    onSuccess: () => {
      utils.performance.getReviews.invalidate();
      setIsReviewModalOpen(false);
      setComments('');
      toast.success('Performance Review Saved', 'The evaluation feedback has been recorded.');
    },
    onError: (err: any) => {
      toast.error('Submission Error', err?.message || 'Failed to submit performance review');
    },
  });

  trpc.performance.getObjectives.useQuery(undefined, {
    initialData: initialObjectives,
  });

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createObj.mutate({ title: newTitle });
    setNewTitle('');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      toast.error('Validation Error', 'Please select an employee');
      return;
    }
    if (!comments.trim()) {
      toast.error('Validation Error', 'Please enter review comments');
      return;
    }

    submitReviewMutation.mutate({
      targetUserId: selectedEmpId,
      reviewPeriod,
      rating,
      comments,
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 size={14} className="text-[var(--emerald)]" />;
    if (status === 'At Risk') return <AlertCircle size={14} className="text-[var(--rose)]" />;
    return <Clock size={14} className="text-[var(--amber)]" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleAddObjective} className="flex flex-1 gap-3">
          <Input
            type="text"
            placeholder="Define new OKR objective..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button
            type="submit"
            disabled={createObj.isPending || !newTitle.trim()}
            className="shrink-0 rounded-xl font-semibold"
          >
            <Plus size={16} /> Add OKR
          </Button>
        </form>

        {isPrivileged && (
          <Button
            type="button"
            onClick={() => {
              setSelectedEmpId(employees[0]?.id || '');
              setIsReviewModalOpen(true);
            }}
            className="btn-primary shrink-0 rounded-xl font-semibold flex items-center gap-2"
          >
            <UserCheck size={16} /> Evaluate Employee
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {initialObjectives?.map((obj: Objective) => (
          <div key={obj.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--brand)]/30">
            <div className="mb-4 flex justify-between items-center">
              <span className="truncate font-semibold text-[var(--text-main)] text-sm md:text-base">{obj.title}</span>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(obj.status)}
                <span className="text-xs">{obj.status}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 rounded-full overflow-hidden bg-[var(--bg-hover)] border border-[var(--border-hairline)]">
                <div
                  className="h-full bg-[var(--brand)] transition-all duration-1000 ease-out"
                  style={{ width: `${obj.progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--text-main)] w-12 text-right">{obj.progress}%</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Update progress:</span>
              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateObj.mutate({ id: obj.id, progress: val })}
                  disabled={updateObj.isPending}
                  className="rounded-md border border-[var(--border-hairline)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text-main)]"
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* HR / Manager Evaluation Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-[var(--brand)]" />
                <h3 className="text-base font-bold text-[var(--text-main)]">Submit Employee Performance Review</h3>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department || emp.role} · {emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Review Period</label>
                  <select
                    value={reviewPeriod}
                    onChange={(e) => setReviewPeriod(e.target.value)}
                    className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="Annual 2026">Annual 2026</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                  >
                    <option value="Exceeds Expectations">Exceeds Expectations</option>
                    <option value="Meets Expectations">Meets Expectations</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Evaluation Comments & Feedback</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter detailed evaluation feedback, achievements, and development points..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border-hairline)] py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitReviewMutation.isPending}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  <Star size={16} />
                  {submitReviewMutation.isPending ? 'Saving...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
