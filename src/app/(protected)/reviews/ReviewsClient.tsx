'use client';

import React, { useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Target, Activity, AlertTriangle, Sparkles, Star, MessageSquare, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

interface Score {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}
interface ReviewItem {
  id: string;
  reviewPeriod: string;
  rating: string;
  comments: string;
  reviewerName: string;
}
interface EmployeeOption {
  id: string;
  name: string;
  designation?: string | null;
}

const REVIEW_DIMENSIONS = [
  'Leadership',
  'Technical',
  'Communication',
  'Teamwork',
  'Punctuality',
  'Adaptability',
];

export default function ReviewsClient({
  scores,
  reviews,
  canReview = false,
  employees = [],
}: {
  scores: Score[];
  reviews: ReviewItem[];
  canReview?: boolean;
  employees?: EmployeeOption[];
}) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState(new Date().getFullYear().toString());
  const [rating, setRating] = useState('Meets Expectations');
  const [comments, setComments] = useState('');
  const [dims, setDims] = useState<Record<string, number>>(
    Object.fromEntries(REVIEW_DIMENSIONS.map((d) => [d, 3]))
  );

  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      utils.invalidate();
      setShowForm(false);
      setSubjectId('');
      setComments('');
      setDims(Object.fromEntries(REVIEW_DIMENSIONS.map((d) => [d, 3])));
    },
  });
  const blindSpot = scores.length
    ? scores.reduce((worst, s) => (Math.abs(s.A - s.B) > Math.abs(worst.A - worst.B) ? s : worst))
    : null;
  const peerHigher = scores.filter((s) => s.B > s.A);
  const hiddenStrength = peerHigher.length
    ? peerHigher.reduce((best, s) => (s.B - s.A > best.B - best.A ? s : best))
    : null;

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="360-Degree Feedback"
        subtitle="Self-perception vs peer-perception, derived from real reviews."
        icon={<Target size={20} />}
      />

      {canReview && (
        <Card className="border-[var(--brand)]/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Send size={18} className="text-[var(--brand)]" /> Submit a Review
              </span>
              <Button variant="primary" size="sm" onClick={() => setShowForm((s) => !s)}>
                {showForm ? 'Cancel' : 'New Review'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showForm && (
            <CardContent className="space-y-4">
              {submitReview.isError && (
                <p className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose)]/10 px-3 py-2 text-sm text-[var(--rose)]">
                  {submitReview.error.message}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Employee</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)]"
                  >
                    <option value="">Select employee…</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.designation ? `· ${emp.designation}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Review Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Overall Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)]"
                  >
                    <option>Exceeds Expectations</option>
                    <option>Meets Expectations</option>
                    <option>Needs Improvement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                  Competency Scores (1–5)
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {REVIEW_DIMENSIONS.map((dim) => (
                    <div key={dim} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-3 py-2">
                      <span className="text-xs text-[var(--text-muted)]">{dim}</span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={dims[dim]}
                        onChange={(e) =>
                          setDims((prev) => ({ ...prev, [dim]: Math.min(5, Math.max(1, Number(e.target.value))) }))
                        }
                        className="w-16 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-app)] px-2 py-1 text-center text-sm text-[var(--text-main)]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)]"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                disabled={!subjectId || submitReview.isPending}
                onClick={() =>
                  submitReview.mutate({
                    userId: subjectId,
                    reviewPeriod: period,
                    rating,
                    comments,
                    scores: REVIEW_DIMENSIONS.map((dimension) => ({ dimension, rating: dims[dimension] })),
                  })
                }
              >
                {submitReview.isPending ? 'Submitting…' : 'Submit Review'}
              </Button>
            </CardContent>
          )}
        </Card>
      )}


      {scores.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Complete a review cycle to see your self-perception vs peer-perception breakdown and derived insights."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="flex h-[500px] flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={18} className="text-[var(--brand)]" /> Competency Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scores}>
                  <PolarGrid stroke="var(--border-hairline)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'transparent' }} axisLine={false} />
                  <Radar name="Self-Score" dataKey="A" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.4} />
                  <Radar name="Peer Average" dataKey="B" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.4} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-panel)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'var(--text-main)', paddingTop: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[var(--amber)]" /> Key Blind Spot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  You rated your <span className="font-semibold text-[var(--brand-strong)]">{blindSpot?.subject}</span> at {blindSpot?.A}, but peers rated you at {blindSpot?.B}.
                  This is the largest gap ({Math.abs((blindSpot?.A ?? 0) - (blindSpot?.B ?? 0)).toFixed(1)} points). Consider asking your team for direct feedback.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--brand)]" /> Hidden Strength
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hiddenStrength ? (
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    You rated your <span className="font-semibold text-[var(--brand-strong)]">{hiddenStrength.subject}</span> at {hiddenStrength.A}, but peers rated you higher at {hiddenStrength.B}.
                    Your team values this more than you realize (+{(hiddenStrength.B - hiddenStrength.A).toFixed(1)} points).
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">No dimension where peers rated you above your self-score yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--brand)]" /> Review History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No individual reviews recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-main)]">{r.reviewPeriod}</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-[var(--amber)]">
                      <Star size={14} className="fill-current" /> {r.rating}/5
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">{r.comments}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">— {r.reviewerName}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
