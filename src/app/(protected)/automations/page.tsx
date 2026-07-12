import { prisma } from '@/lib/prisma';
import { Workflow, Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function AutomationsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session || (session.user as any)?.role !== 'Admin') {
    return <div>Unauthorized</div>;
  }

  const rules = await prisma.automationRule.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 space-y-8 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
            <Workflow className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono">
              No-Code HR Automations
            </h1>
            <p className="text-[var(--text-muted)] mt-2 font-mono">
              Visual workflow builder for dynamic business logic.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-mono transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)]">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-lg hover:border-purple-500/50 transition-colors group">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{rule.name}</h3>
              <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
            </div>
            
            <div className="mt-4 space-y-3 font-mono text-sm">
              <div className="bg-[var(--bg-main)] p-3 rounded-md border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] uppercase text-xs">If Trigger:</span>
                <p className="text-blue-400 mt-1">{rule.triggerEvent}</p>
              </div>
              <div className="bg-[var(--bg-main)] p-3 rounded-md border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] uppercase text-xs">Condition:</span>
                <p className="text-orange-400 mt-1">{rule.condition}</p>
              </div>
              <div className="bg-[var(--bg-main)] p-3 rounded-md border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] uppercase text-xs">Then Action:</span>
                <p className="text-green-400 mt-1">{rule.action}</p>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] font-mono border-2 border-dashed border-[var(--border-color)] rounded-xl">
            No active automation rules. Click "New Rule" to build one.
          </div>
        )}
      </div>
    </div>
  );
}
