'use client';

import React, { useState } from 'react';
import { Lock, FileDigit, Search, ShieldCheck } from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface AuditClientPageProps {
  initialEvents: any[];
}

export default function AuditClientPage({ initialEvents }: AuditClientPageProps) {
  useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const events = initialEvents || [];
  const filteredEvents = events.filter((event: any) =>
    event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.actorName && event.actorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    event.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Lock className="h-5 w-5" />}
        title="Immutable Audit Trail"
        subtitle="Cryptographically secured event-sourced ledger."
        actions={
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search hash / actor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      <Card>
        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No Events Found"
            description="No system records match your query."
            icon={<FileDigit className="h-5 w-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event ID / Hash</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono font-semibold text-xs">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                    {event.hash || event.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[var(--text-main)]">{event.actorName || event.actorId}</span>
                      <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{event.actorRole}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="font-mono uppercase tracking-wide">{event.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--text-muted)] max-w-xs truncate">
                    {event.details ? JSON.stringify(event.details) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
