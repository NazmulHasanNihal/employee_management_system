"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Database, Lock, Clock, MapPin, Navigation, Save, Check } from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

type FlagKey = 'maintenanceMode' | 'debugLogging' | 'strictAuth' | 'autoProvision';

const DEFAULT_FLAGS: Record<FlagKey, boolean> = {
  maintenanceMode: false,
  debugLogging: true,
  strictAuth: true,
  autoProvision: false,
};

export default function SettingsClientPage() {
  const { user, isAdmin } = useUser();
  const { language } = useAppStore();
  const t = useTranslation(language);

  const { data: savedFlags } = trpc.settings.getSystemSettings.useQuery();
  const setSettingMutation = trpc.settings.setSystemSetting.useMutation();

  const [flags, setFlags] = useState<Record<FlagKey, boolean>>(DEFAULT_FLAGS);
  const [loaded, setLoaded] = useState(false);

  // Office hours
  const [officeStart, setOfficeStart] = useState('09:00');
  const [officeEnd, setOfficeEnd] = useState('17:00');
  const [officeGrace, setOfficeGrace] = useState(10);
  const [officeTimezone, setOfficeTimezone] = useState('Asia/Dhaka');
  const [savingOffice, setSavingOffice] = useState(false);
  const [officeSaved, setOfficeSaved] = useState(false);

  // Office Geo-Fence (50 meters)
  const [officeLat, setOfficeLat] = useState('23.8103');
  const [officeLng, setOfficeLng] = useState('90.4125');
  const [officeRadius, setOfficeRadius] = useState(50);
  const [savingGeo, setSavingGeo] = useState(false);
  const [geoSaved, setGeoSaved] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    if (savedFlags && !loaded) {
      const next = { ...DEFAULT_FLAGS };
      (Object.keys(DEFAULT_FLAGS) as FlagKey[]).forEach((k) => {
        if (savedFlags[k] !== undefined) next[k] = savedFlags[k] === 'true';
      });
      setFlags(next);

      if (savedFlags.officeHours) {
        try {
          const oh = JSON.parse(savedFlags.officeHours);
          if (oh.start) setOfficeStart(oh.start);
          if (oh.end) setOfficeEnd(oh.end);
          if (typeof oh.graceMinutes === 'number') setOfficeGrace(oh.graceMinutes);
          if (oh.timezone) setOfficeTimezone(oh.timezone);
        } catch { /* ignore */ }
      }

      if (savedFlags.officeGeo) {
        try {
          const geo = JSON.parse(savedFlags.officeGeo);
          if (geo.lat != null) setOfficeLat(String(geo.lat));
          if (geo.lng != null) setOfficeLng(String(geo.lng));
          if (typeof geo.radiusMeters === 'number') setOfficeRadius(geo.radiusMeters);
        } catch { /* ignore */ }
      }

      setLoaded(true);
    }
  }, [savedFlags, loaded]);

  const handleToggle = (key: FlagKey) => {
    const value = !flags[key];
    setFlags((prev) => ({ ...prev, [key]: value }));
    setSettingMutation.mutate({ key, value: String(value) });
  };

  const saveOfficeHours = () => {
    setSavingOffice(true);
    setOfficeSaved(false);
    setSettingMutation.mutate(
      { key: 'officeHours', value: JSON.stringify({ start: officeStart, end: officeEnd, graceMinutes: officeGrace, timezone: officeTimezone }) },
      {
        onSuccess: () => {
          setSavingOffice(false);
          setOfficeSaved(true);
          toast.success('Office Hours Saved', 'Standard working hours updated.');
          setTimeout(() => setOfficeSaved(false), 2500);
        },
        onError: (err: any) => {
          setSavingOffice(false);
          toast.error('Save Failed', err?.message || 'Failed to save');
        },

      }
    );
  };

  const saveGeoFence = () => {
    setSavingGeo(true);
    setGeoSaved(false);
    const latNum = parseFloat(officeLat);
    const lngNum = parseFloat(officeLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error('Invalid Coordinates', 'Please enter valid numbers for latitude and longitude.');
      setSavingGeo(false);
      return;
    }

    setSettingMutation.mutate(
      { key: 'officeGeo', value: JSON.stringify({ lat: latNum, lng: lngNum, radiusMeters: Number(officeRadius) || 50 }) },
      {
        onSuccess: () => {
          setSavingGeo(false);
          setGeoSaved(true);
          toast.success('Office Geo-Fence Saved', `Target location updated (${officeRadius}m radius).`);
          setTimeout(() => setGeoSaved(false), 2500);
        },
        onError: (err: any) => {
          setSavingGeo(false);
          toast.error('Save Failed', err?.message || 'Failed to save');
        },

      }
    );
  };

  const detectCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS Not Supported', 'Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOfficeLat(pos.coords.latitude.toFixed(6));
        setOfficeLng(pos.coords.longitude.toFixed(6));
        setDetectingGps(false);
        toast.success('GPS Location Detected', `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        setDetectingGps(false);
        toast.error('GPS Error', err.message || 'Unable to retrieve location');
      },
      { enableHighAccuracy: true }
    );
  };

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <EmptyState title="Access Denied" description="System configuration requires Admin clearance." icon={<Lock className="h-5 w-5" />} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Cpu className="h-5 w-5" />}
        title={t('System Configuration')}
        subtitle={t('Global policies & system variables.')}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Main Matrix Panel */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock size={20} className="text-[var(--brand-strong)]" /> {t('tRPC Permission Matrix')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="table-responsive-md md:table-responsive-card">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="border border-[var(--border-hairline)] bg-[var(--bg-hover)] text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                      <tr>
                        <th className="rounded-tl-xl p-4 pl-6">{t('Resource Endpoint')}</th>
                        <th className="p-4 text-center">{t('L4 Admin')}</th>
                        <th className="p-4 text-center">{t('L3 HR')}</th>
                        <th className="rounded-tr-xl p-4 pr-6 text-center">{t('L1 Employee')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-hairline)] border-x border-b border-[var(--border-hairline)] rounded-b-xl bg-[var(--bg-panel)] text-sm">
                      {[
                        { m: 'PAYROLL (Read/Write)', a: 'R/W/D', hr: 'R/W', e: 'R (Self)' },
                        { m: 'ATTENDANCE (Clock)', a: 'R/W/D', hr: 'R/W', e: 'R/W (Self)' },
                        { m: 'LEAVE (Approvals)', a: 'R/W', hr: 'R/W', e: 'None' },
                        { m: 'AUDIT (Immutable)', a: 'R (Immutable)', hr: 'None', e: 'None' },
                        { m: 'DEI (Intelligence)', a: 'R', hr: 'R', e: 'None' },
                        { m: 'RECRUITMENT (ATS)', a: 'R/W', hr: 'R/W', e: 'None' },
                      ].map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-[var(--bg-hover)]">
                          <td className="p-4 pl-6 font-semibold text-[var(--text-main)]">{row.m}</td>
                          <td className="p-4 text-center"><Badge variant="rose">{row.a}</Badge></td>
                          <td className="p-4 text-center"><Badge variant="amber">{row.hr}</Badge></td>
                          <td className="p-4 pr-6 text-center"><Badge variant="emerald">{row.e}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Geo-Fence Coordinates Configuration */}
          <Card className="border-[var(--brand)]/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--brand)]" /> {/* @ts-ignore */}<T>Office Geo-Fence & Location Settings</T></span>
                <Badge variant="brand">{/* @ts-ignore */}<T>50m Radius Guard</T></Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-xs text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Set the exact GPS latitude and longitude coordinates for your office location. The attendance system evaluates employee distance against this point within the configured meter radius.</T></p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Office Latitude (°N/S)</T></label>
                  <input
                    type="text"
                    value={officeLat}
                    onChange={(e) => setOfficeLat(e.target.value)}
                    placeholder="e.g. 23.8103"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Office Longitude (°E/W)</T></label>
                  <input
                    type="text"
                    value={officeLng}
                    onChange={(e) => setOfficeLng(e.target.value)}
                    placeholder="e.g. 90.4125"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Radius (Meters)</T></label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={officeRadius}
                    onChange={(e) => setOfficeRadius(Number(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectCurrentGpsLocation}
                  disabled={detectingGps}
                  className="rounded-xl flex items-center gap-2 text-xs"
                >
                  <Navigation size={14} className={detectingGps ? 'animate-spin' : ''} />
                  {detectingGps ? 'Detecting Location...' : 'Use My Current GPS Coordinates'}
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={saveGeoFence}
                    disabled={savingGeo}
                    className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                  >
                    <Save size={14} />
                    {savingGeo ? 'Saving...' : 'Save Geo-Fence Location'}
                  </Button>
                  {geoSaved && (
                    <span className="flex items-center gap-1 text-xs font-bold text-[var(--emerald)]">
                      <Check size={14} /> {/* @ts-ignore */}<T>Saved!</T></span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Metrics Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-[var(--brand-strong)]" /> {t('System Health')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-[var(--emerald)]" />
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{t('Database Status')}</span>
                </div>
                <Badge variant="emerald">{t('ONLINE')}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-[var(--brand-strong)]" />
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{t('tRPC Uptime')}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-strong)]">99.999%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-[var(--brand-strong)]" /> {t('Office Time')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[var(--text-muted)]">{t('Set the standard working hours shown across OpsHub (dashboard clock, shifts, attendance).')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Start</T></label>
                  <input type="time" value={officeStart} onChange={(e) => setOfficeStart(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>End</T></label>
                  <input type="time" value={officeEnd} onChange={(e) => setOfficeEnd(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Grace (min)</T></label>
                  <input type="number" min={0} max={60} value={officeGrace} onChange={(e) => setOfficeGrace(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Timezone</T></label>
                  <input value={officeTimezone} onChange={(e) => setOfficeTimezone(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveOfficeHours} disabled={savingOffice} className="btn-primary px-4 py-2 text-sm">
                  {savingOffice ? t('Saving…') : t('Save Office Time')}
                </Button>
                {officeSaved && <span className="text-xs font-medium text-[var(--emerald)]">{t('Saved!')}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-[var(--brand-strong)]" /> {t('System Flags')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'maintenanceMode', label: 'Maintenance Mode' },
                { key: 'debugLogging', label: 'Verbose Debug Logging' },
                { key: 'strictAuth', label: 'Strict 2FA Enforced' },
                { key: 'autoProvision', label: 'Auto-Provision Accounts' },
              ].map((flag) => {
                const on = flags[flag.key as keyof typeof flags];
                return (
                  <div key={flag.key} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--text-main)]">{t(flag.label)}</span>
                    <button
                      type="button"
                      onClick={() => handleToggle(flag.key as keyof typeof flags)}
                      className={`relative h-5 w-10 rounded-full transition-colors ${on ? 'bg-[var(--brand)]' : 'bg-[var(--bg-panel)] border border-[var(--border-hairline)]'}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
