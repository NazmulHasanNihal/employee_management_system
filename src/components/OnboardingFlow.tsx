'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Upload, Phone, FileText } from 'lucide-react';

export default function OnboardingFlow({ user }: { user: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [emergencyContact, setEmergencyContact] = useState('');

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContact, photoUploaded: !!photo }),
      });
      if (res.ok) {
        window.location.href = '/'; // Force reload to bypass layout state
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-[var(--ledger-blue)] transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-[var(--ledger-blue)] mb-2">
          Welcome to the Team
        </h1>
        <p className="text-[var(--text-muted)] mb-8 font-mono text-sm">
          Let's get your profile set up in 3 quick steps.
        </p>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="text-[var(--ledger-blue)]" /> Step 1: Profile Photo
            </h2>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[var(--ledger-blue)]/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
              {photo ? (
                <div className="text-[var(--verify-green)] font-mono font-bold flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} />
                  {photo.name}
                </div>
              ) : (
                <div className="text-[var(--text-muted)] flex flex-col items-center gap-2">
                  <Upload size={32} />
                  <span className="font-mono">Click or drag photo here</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setStep(2)}
              className="mt-6 w-full py-4 bg-white text-black font-bold font-mono uppercase tracking-widest rounded-xl hover:bg-[var(--ledger-blue)] transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Phone className="text-[var(--signal-amber)]" /> Step 2: Emergency Contact
            </h2>
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">
                Phone Number
              </label>
              <input 
                type="text" 
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+1 555-0192"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-white/5 text-white font-bold font-mono uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-white text-black font-bold font-mono uppercase tracking-widest rounded-xl hover:bg-[var(--ledger-blue)] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-purple-400" /> Step 3: Company Policies
            </h2>
            <div className="bg-black/50 border border-white/10 p-6 rounded-xl text-sm text-[var(--text-muted)] space-y-4 max-h-48 overflow-y-auto font-mono">
              <p>1. Data Privacy: Ensure all company data is treated with confidentiality.</p>
              <p>2. Attendance: Standard working hours apply unless an exception is provided.</p>
              <p>3. IT Assets: You are responsible for the physical security of your devices.</p>
            </div>
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-white/5 text-white font-bold font-mono uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button 
                onClick={completeOnboarding}
                disabled={loading}
                className="flex-1 py-4 bg-[var(--verify-green)] text-black font-bold font-mono uppercase tracking-widest rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Completing...' : <><CheckCircle2 size={18} /> I Agree</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
