import { prisma } from '@/lib/prisma';
import { ShieldAlert } from 'lucide-react';

export default async function AuditLedgerPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <div className="p-8 space-y-8 h-full">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/20 text-red-400 rounded-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-400 font-mono">
            Immutable SOC-2 Audit Ledger
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-mono">
            Tamper-proof record of all database mutations. Visible to global administrators only.
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-mono text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor ID</th>
                <th className="px-6 py-4">Action Route</th>
                <th className="px-6 py-4">Target Data (Truncated)</th>
                <th className="px-6 py-4 text-right">Verification Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-mono text-[var(--text-main)]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--bg-main)] transition-colors group">
                  <td className="px-6 py-4 text-[var(--text-muted)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-400">
                    {log.actor.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-orange-300">
                    {log.target}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-[var(--text-muted)]">
                    {log.hash || 'system'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">
                    No mutations recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
