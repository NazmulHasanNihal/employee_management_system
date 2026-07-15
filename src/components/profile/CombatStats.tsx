import React from 'react';
import { Shield } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export function CombatStats({ user }: { user: any }) {
  return (
    <div className="ledger-panel p-6">
      <h4 className="font-mono text-[10px] font-bold text-[var(--ledger-blue)] uppercase tracking-widest mb-4 flex items-center gap-2">
        <Shield size={14}/> Combat Stats (Skills)
      </h4>
      <div className="min-h-[180px] w-full md:min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
            { subject: 'Leadership', A: Math.min(100, 40 + ((user.rpgLevel || 1) * 5)), fullMark: 100 },
            { subject: 'Output', A: Math.min(100, 60 + ((user.rpgLevel || 1) * 3)), fullMark: 100 },
            { subject: 'Teamwork', A: Math.min(100, 50 + ((user.rpgLevel || 1) * 4)), fullMark: 100 },
            { subject: 'Reliability', A: Math.min(100, 70 + ((user.rpgLevel || 1) * 2)), fullMark: 100 },
            { subject: 'Initiative', A: Math.min(100, 30 + ((user.rpgLevel || 1) * 6)), fullMark: 100 },
          ]}>
            <PolarGrid stroke="var(--ledger-border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} />
            <Radar name="Stats" dataKey="A" stroke="var(--ledger-blue)" fill="var(--ledger-blue)" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
