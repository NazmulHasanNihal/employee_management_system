"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Fingerprint, LogOut, ShieldAlert } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import posthog from 'posthog-js';

export function ClockInWidget() {
  const utils = trpc.useUtils();
  
  const { data: activeSession, isLoading: loadingActive } = trpc.attendance.getActiveSession.useQuery();

  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    // Request geolocation on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setGeoError("Location access denied. Your clock-in will be flagged.")
      );
    } else {
      setGeoError("Geolocation not supported by this browser.");
    }
  }, []);

  const clockIn = trpc.attendance.clockIn.useMutation({
    onSuccess: () => {
      utils.attendance.getActiveSession.invalidate();
      utils.attendance.getLogs.invalidate();
      posthog.capture('employee_clock_in', {
        has_location: !!location,
      });
    }
  });

  const clockOut = trpc.attendance.clockOut.useMutation({
    onSuccess: () => {
      utils.attendance.getActiveSession.invalidate();
      utils.attendance.getLogs.invalidate();
      posthog.capture('employee_clock_out');
    }
  });

  const handleClockIn = () => {
    clockIn.mutate({
      latitude: location?.lat,
      longitude: location?.lng
    });
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loadingActive) return <div className="text-center p-8 text-[var(--text-muted)] animate-pulse font-mono">Initializing Biometrics...</div>;

  return (
    <Card className="bg-black/60 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ledger-blue)]/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
      
      <CardContent className="p-8 pt-8">
        <div className="text-center space-y-2 mb-8 relative z-10">
          <h3 className="text-5xl font-black font-mono text-white tracking-tighter shadow-black drop-shadow-md">
            {currentTime.toLocaleTimeString([], { hour12: false })}
          </h3>
          <p className="text-xs font-mono text-[var(--ledger-blue)] uppercase tracking-widest">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-8 text-xs font-mono relative z-10">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
            <MapPin size={14} /> Location Status
          </div>
          {location ? (
            <div className="text-[var(--verify-green)] flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--verify-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--verify-green)]"></span>
              </span>
              GPS Acquired: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          ) : (
            <div className="text-[var(--signal-amber)] flex items-center gap-2">
              <ShieldAlert size={14} /> {geoError || "Locating..."}
            </div>
          )}
        </div>

        <div className="relative z-10">
          {!activeSession ? (
            <Button 
              onClick={handleClockIn}
              disabled={clockIn.isPending}
              variant="default"
              className="w-full h-24 bg-white text-black rounded-xl text-sm font-mono font-bold uppercase tracking-widest hover:bg-[var(--ledger-blue)] hover:shadow-[0_0_20px_var(--ledger-blue)] transition-all flex flex-col items-center justify-center gap-2 group/btn"
            >
              <Fingerprint size={24} className="group-hover/btn:scale-125 transition-transform" />
              {clockIn.isPending ? 'Verifying...' : 'Initialize Session'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-[var(--verify-green)]/10 border border-[var(--verify-green)]/30 rounded-xl">
                <p className="text-[10px] font-mono text-[var(--verify-green)] uppercase mb-1">Session Active Since</p>
                <p className="text-lg font-bold text-white font-mono">{activeSession.clockIn ? new Date(activeSession.clockIn).toLocaleTimeString() : '--'}</p>
              </div>
              <Button 
                onClick={() => clockOut.mutate()}
                disabled={clockOut.isPending}
                variant="outline"
                className="w-full h-14 bg-transparent border-2 border-[var(--alert-red)] text-[var(--alert-red)] rounded-xl text-sm font-mono font-bold uppercase tracking-widest hover:bg-[var(--alert-red)] hover:text-black hover:shadow-[0_0_20px_var(--alert-red)] transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                {clockOut.isPending ? 'Terminating...' : 'End Session'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
