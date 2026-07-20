'use client';

import React, { useState } from 'react';
import { GraduationCap, CheckCircle2, BookOpen, ShieldCheck } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  catalog: any[];
  compliance: any[];
  isAdmin: boolean;
}

export function TrainingClient({ catalog, compliance, isAdmin }: Props) {
  const utils = trpc.useUtils();
  // Live catalog (seeded with server prop) so enroll/progress refreshes in place.
  const { data: catalogData } = trpc.training.catalog.useQuery(undefined, { initialData: catalog as any });
  const liveCatalog = (catalogData as any[] | undefined) ?? catalog ?? [];
  const enroll = trpc.training.enroll.useMutation({ onSuccess: () => utils.training.catalog.invalidate() });
  const updateProgress = trpc.training.updateProgress.useMutation({ onSuccess: () => utils.training.catalog.invalidate() });

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--emerald)]" /> Compliance Training — Org Status</CardTitle>
          </CardHeader>
          <CardContent>
            {compliance.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No compliance enrollments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-left text-[10px] uppercase text-[var(--text-muted)]">
                      <th className="py-2 pr-4">Employee</th>
                      <th className="py-2 pr-4">Course</th>
                      <th className="py-2 pr-4">Progress</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.map((e: any) => (
                      <tr key={e.id} className="border-b border-[var(--border-hairline)]">
                        <td className="py-2 pr-4 font-medium text-[var(--text-main)]">{e.user?.name || 'N/A'}</td>
                        <td className="py-2 pr-4 text-[var(--text-muted)]">{e.course?.title}</td>
                        <td className="py-2 pr-4">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${e.progress}%` }} />
                          </div>
                        </td>
                        <td className="py-2">
                          <Badge variant={e.status === 'Completed' ? 'emerald' : 'amber'}>{e.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Course Catalog</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveCatalog.map((course: any) => {
            const enrollment = course.enrollment;
            return (
              <Card key={course.id} className="flex flex-col">
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      <BookOpen size={20} />
                    </div>
                    <Badge variant={course.category === 'Compliance' ? 'amber' : 'secondary'}>{course.category}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-main)]">{course.title}</h3>
                    {course.titleBn && <p className="text-xs text-[var(--text-muted)]">{course.titleBn}</p>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{course.description}</p>
                  <p className="text-[10px] uppercase text-[var(--text-muted)]">{course.durationHours}h · {enrollment ? `Your progress ${enrollment.progress}%` : 'Not enrolled'}</p>

                  {enrollment ? (
                    <div className="space-y-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                        <div className="h-full rounded-full bg-[var(--emerald)]" style={{ width: `${enrollment.progress}%` }} />
                      </div>
                      {enrollment.status === 'Completed' ? (
                        <p className="flex items-center gap-1 text-xs font-semibold text-[var(--emerald)]"><CheckCircle2 size={14} /> Completed</p>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateProgress.mutate({ id: enrollment.id, progress: Math.min(100, enrollment.progress + 25) })}>Mark +25%</Button>
                          {enrollment.progress >= 75 && (
                            <Button size="sm" onClick={() => updateProgress.mutate({ id: enrollment.id, progress: 100 })}>Complete</Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" disabled={enroll.isPending} onClick={() => enroll.mutate({ courseId: course.id })}>
                      <GraduationCap size={14} /> Enroll
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
