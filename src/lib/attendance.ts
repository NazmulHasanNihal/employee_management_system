// ─────────────────────────────────────────────────────────────────────────────
// Shift/factory attendance calculation (C1).
//
// Computes lateness, worked minutes, overtime, and night-differential minutes
// from clock-in/out times and shift definition. Handles shifts that wrap past
// midnight (e.g. 22:00 → 06:00) and an optional geo-fence for clock-in
// validation.
// ─────────────────────────────────────────────────────────────────────────────

export interface ShiftDef {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm" (may be < startTime for night shifts)
  graceMinutes?: number; // default 10
  breakMinutes?: number; // unpaid break, default 60
  isNightShift?: boolean;
}

export interface GeoFence {
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface AttendanceInput {
  clockIn: Date;
  clockOut?: Date | null;
  shift: ShiftDef;
  geoLat?: number | null;
  geoLng?: number | null;
  geoFence?: GeoFence | null;
}

export interface AttendanceResult {
  status: 'Present' | 'Late' | 'Absent';
  lateMinutes: number;
  workedMinutes: number; // clock-out - clock-in - break
  overtimeMinutes: number; // worked beyond standard shift duration
  nightMinutes: number; // minutes falling in the night-differential window
  geoVerified: boolean;
}

// Night-differential window (local time): 22:00 – 06:00.
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 6;

function parseHHmm(value: string): { h: number; m: number } {
  const [h, m] = value.split(':').map((n) => parseInt(n, 10));
  return { h, m };
}

function toMinutesOfDay(d: Date): number {
  const { h, m } = dhakaHourMin(d);
  return h * 60 + m;
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Count how many minutes within [startMs, endMs] fall inside the night
 * differential window (22:00 – 06:00 local time). The window spans midnight,
 * so we evaluate each sampled minute's clock-time rather than anchoring to a
 * single calendar date. Times are interpreted in Asia/Dhaka (UTC+06).
 */
// Fixed Dhaka offset in minutes (UTC+06 = 360).
export const DHAKA_OFFSET_MIN = 360;

function dhakaHourMin(d: Date): { h: number; m: number } {
  // Convert UTC instant to Dhaka local wall-clock.
  const local = new Date(d.getTime() + DHAKA_OFFSET_MIN * 60 * 1000);
  return { h: local.getUTCHours(), m: local.getUTCMinutes() };
}

function isNightDhaka(d: Date): boolean {
  const { h, m } = dhakaHourMin(d);
  const mins = h * 60 + m;
  // Night window: 22:00 (1320) through 23:59, and 00:00 through 05:59.
  return mins >= NIGHT_START_HOUR * 60 || mins < NIGHT_END_HOUR * 60;
}

/** Format a Date as Dhaka 12-hour time, e.g. "10:30 PM". */
export function formatDhaka12h(d: Date): string {
  const { h, m } = dhakaHourMin(d);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function nightMinutesBetween(startMs: number, endMs: number): number {
  if (endMs <= startMs) return 0;
  // Sample minute-by-minute (attendance spans are at most ~24h, so this is cheap).
  let count = 0;
  const stepMs = 60 * 1000;
  // Sample each minute bucket [cursor, cursor+1min). Start at the top of the
  // minute containing startMs; stop before endMs (the closing instant belongs
  // to the next bucket, mirroring how workedMinutes counts [start, end)).
  let cursor = Math.ceil(startMs / stepMs) * stepMs;
  while (cursor < endMs) {
    if (isNightDhaka(new Date(cursor))) count++;
    cursor += stepMs;
  }
  return count;
}

export function computeAttendance(input: AttendanceInput): AttendanceResult {
  const { clockIn, clockOut, shift, geoLat, geoLng, geoFence } = input;
  const grace = shift.graceMinutes ?? 10;
  const breakMin = shift.breakMinutes ?? 60;

  const start = parseHHmm(shift.startTime);
  const end = parseHHmm(shift.endTime);
  const shiftStartMin = start.h * 60 + start.m;

  // Geo-fence validation.
  let geoVerified = true;
  if (geoFence && geoLat != null && geoLng != null) {
    const dist = haversineMeters(geoLat, geoLng, geoFence.lat, geoFence.lng);
    geoVerified = dist <= geoFence.radiusMeters;
  } else if (geoFence) {
    // Fence configured but no location captured → not verified.
    geoVerified = false;
  }

  if (!clockOut) {
    // Not clocked out yet: status only reflects lateness.
    const lateMinutes = Math.max(0, toMinutesOfDay(clockIn) - (shiftStartMin + grace));
    return {
      status: lateMinutes > 0 ? 'Late' : 'Present',
      lateMinutes,
      workedMinutes: 0,
      overtimeMinutes: 0,
      nightMinutes: 0,
      geoVerified,
    };
  }

  const clockInMin = toMinutesOfDay(clockIn);
  const lateMinutes = Math.max(0, clockInMin - (shiftStartMin + grace));

  // Standard shift duration (handles wrap past midnight).
  let standardDur = end.h * 60 + end.m - shiftStartMin;
  if (standardDur <= 0) standardDur += 24 * 60;

  const workedMs = clockOut.getTime() - clockIn.getTime();
  const workedMinutes = Math.max(0, Math.round(workedMs / 60000) - breakMin);

  const overtimeMinutes = Math.max(0, workedMinutes - standardDur);

  const nightMinutes = nightMinutesBetween(clockIn.getTime(), clockOut.getTime());

  const status: AttendanceResult['status'] =
    lateMinutes > 0 ? 'Late' : 'Present';

  return {
    status,
    lateMinutes,
    workedMinutes,
    overtimeMinutes,
    nightMinutes,
    geoVerified,
  };
}
