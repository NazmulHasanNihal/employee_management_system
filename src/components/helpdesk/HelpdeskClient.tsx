'use client';

import React, { useState } from 'react';
import { LifeBuoy, MessageSquare, Plus, CheckCircle2, Clock, AlertTriangle, AlertCircle, Send, Ticket } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface HelpdeskClientProps {
  initialTickets: any[];
  userId: string;
  isPrivileged: boolean;
}

function getPriorityVariant(p: string) {
  if (p === 'Critical') return 'rose';
  if (p === 'High') return 'rose';
  if (p === 'Medium') return 'amber';
  return 'sky';
}

function getStatusVariant(s: string) {
  if (s === 'Resolved') return 'emerald';
  if (s === 'In Progress') return 'amber';
  return 'rose';
}

function getPriorityIcon(p: string) {
  if (p === 'High') return <AlertTriangle className="h-3.5 w-3.5" />;
  if (p === 'Medium') return <AlertCircle className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}

export function HelpdeskClient({ initialTickets, userId, isPrivileged }: HelpdeskClientProps) {
  const [tickets, setTickets] = useState<any[]>(initialTickets || []);
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Low');
  const [description, setDescription] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();

  const createTicket = trpc.helpdesk.createTicket.useMutation({
    onSuccess: () => {
      utils.helpdesk.getTickets.invalidate();
      setSubject('');
      setDescription('');
      setPriority('Low');
    },
  });

  const addReply = trpc.helpdesk.addReply.useMutation({
    onSuccess: (_data, variables) => {
      setReplyTexts((prev) => ({ ...prev, [variables.ticketId]: '' }));
      utils.helpdesk.getTickets.invalidate();
    },
  });

  const updateStatus = trpc.helpdesk.updateTicketStatus.useMutation({
    onSuccess: () => utils.helpdesk.getTickets.invalidate(),
  });

  const canReply = (ticket: any) =>
    ticket.status !== 'Resolved' && (ticket.userId === userId || isPrivileged);

  const handleReply = (ticketId: string) => {
    const text = replyTexts[ticketId];
    if (!text || !text.trim()) return;
    addReply.mutate({ ticketId, content: text.trim() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    createTicket.mutate({ subject, priority });
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--brand-strong)]" /> New Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Subject / Title</label>
                <Input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Cannot access staging VPN"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Severity Level</label>
                <select
                  className="ledger-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low - Minor issue, no blocker</option>
                  <option value="Medium">Medium - Workflow impeded</option>
                  <option value="High">High - Critical system blocker</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide logs or specific details..."
                  className="ledger-input resize-none"
                />
              </div>
              <Button type="submit" disabled={createTicket.isPending || !subject.trim() || !description.trim()}>
                <Send className="h-4 w-4" /> Open Ticket
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <Ticket className="h-4 w-4" /> Active Ticket Feed
        </h2>

        {(!tickets || tickets.length === 0) ? (
          <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
            <LifeBuoy className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">No Active Tickets</h3>
          </div>
        ) : (
          <div className="custom-scrollbar max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {tickets.map((ticket: any) => (
              <Card key={ticket.id}>
                <CardContent className="space-y-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Ticket #{ticket.id.slice(0, 6)}</p>
                        <h4 className="text-lg font-semibold text-[var(--text-main)]">{ticket.subject}</h4>
                      </div>
                    </div>
                    <Badge variant={getPriorityVariant(ticket.priority) as any}>
                      {getPriorityIcon(ticket.priority)} {ticket.priority} Priority
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-hover)] p-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Current Status</p>
                      <Badge variant={getStatusVariant(ticket.status) as any}>
                        {ticket.status === 'Resolved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Created At</p>
                      <p className="text-xs text-[var(--text-main)]">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(ticket.replies || []).map((reply: any) => (
                      <div
                        key={reply.id}
                        className="ml-4 rounded-xl border-l-2 border-[var(--brand)] bg-[var(--bg-hover)] p-4"
                      >
                        <div className="mb-1 flex justify-between">
                          <span className="text-xs font-semibold text-[var(--text-main)]">
                            {reply.author?.name || (reply.authorId === userId ? 'You' : 'Support')}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{reply.content}</p>
                      </div>
                    ))}

                    {canReply(ticket) && (
                      <div className="ml-4 flex gap-2">
                        <Input
                          placeholder="Type a reply..."
                          value={replyTexts[ticket.id] || ''}
                          onChange={(e) =>
                            setReplyTexts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          disabled={addReply.isPending}
                          onClick={() => handleReply(ticket.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isPrivileged && ticket.status !== 'Resolved' && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-hairline)] pt-4">
                      {ticket.status === 'Open' && (
                        <Button variant="outline" size="sm" className="text-[var(--amber)]" onClick={() => updateStatus.mutate({ id: ticket.id, status: 'In Progress' })} disabled={updateStatus.isPending}>
                          Mark In Progress
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-[var(--emerald)]" onClick={() => updateStatus.mutate({ id: ticket.id, status: 'Resolved' })} disabled={updateStatus.isPending}>
                        <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
