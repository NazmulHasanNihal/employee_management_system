'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Target, Activity } from 'lucide-react';

const mockData = [
  { subject: 'Leadership', A: 4.5, B: 3.2, fullMark: 5 },
  { subject: 'Technical Skill', A: 5.0, B: 4.8, fullMark: 5 },
  { subject: 'Communication', A: 3.8, B: 4.5, fullMark: 5 },
  { subject: 'Teamwork', A: 4.0, B: 4.2, fullMark: 5 },
  { subject: 'Problem Solving', A: 4.6, B: 4.0, fullMark: 5 },
  { subject: 'Punctuality', A: 3.5, B: 3.8, fullMark: 5 },
];

export default function ReviewsPage() {
  return (
    <div className="p-8 space-y-8 h-full">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
          <Target className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">
            360-Degree Feedback Radar
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-mono">
            Visualizing Self-Perception vs. Peer-Perception to eliminate blind spots.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-2xl h-[500px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 font-mono flex items-center gap-2">
            <Activity className="text-blue-400" /> Competency Radar
          </h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'transparent' }} axisLine={false} />
                <Radar name="Self-Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="Peer Average" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', color: 'white', paddingTop: '20px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-white mb-2">Key Blind Spot Identified</h4>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              You rated your <span className="text-blue-400 font-bold">Leadership</span> at 4.5, but peers rated you at 3.2. 
              This is a significant gap (1.3 points). Consider asking your team for direct feedback on how you can improve delegation and communication.
            </p>
          </div>
          
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-white mb-2">Hidden Strength Identified</h4>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              You rated your <span className="text-blue-400 font-bold">Communication</span> at 3.8, but peers rated you higher at 4.5. 
              Your team values your clarity more than you realize.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
