import { describe, it, expect } from 'vitest';
import { computeAttendance, haversineMeters, formatDhaka12h } from '@/lib/attendance';

// Build a Date whose Dhaka (UTC+06) wall-clock is the given hour/minute.
// We emit the equivalent UTC instant so tests are deterministic regardless of
// the machine's local timezone.
function at(dhakaHour: number, dhakaMinute = 0, dayOffset = 0): Date {
  const d = new Date(Date.UTC(2026, 0, 5 + dayOffset, dhakaHour - 6, dhakaMinute, 0));
  return d;
}

describe('formatDhaka12h', () => {
  it('formats Dhaka wall-clock in 12-hour format', () => {
    expect(formatDhaka12h(at(22, 0))).toBe('10:00 PM');
    expect(formatDhaka12h(at(0, 5))).toBe('12:05 AM');
    expect(formatDhaka12h(at(13, 30))).toBe('1:30 PM');
    expect(formatDhaka12h(at(6, 0))).toBe('6:00 AM');
  });
});

describe('computeAttendance — lateness', () => {
  it('is Present when clocking in before grace', () => {
    const r = computeAttendance({
      clockIn: at(9, 5),
      shift: { startTime: '09:00', endTime: '17:00', graceMinutes: 10 },
    });
    expect(r.status).toBe('Present');
    expect(r.lateMinutes).toBe(0);
  });

  it('is Late when clocking in after grace window', () => {
    const r = computeAttendance({
      clockIn: at(9, 25),
      shift: { startTime: '09:00', endTime: '17:00', graceMinutes: 10 },
    });
    expect(r.status).toBe('Late');
    expect(r.lateMinutes).toBe(15);
  });

  it('reports no worked/overtime minutes before clock-out', () => {
    const r = computeAttendance({
      clockIn: at(9, 0),
      shift: { startTime: '09:00', endTime: '17:00' },
    });
    expect(r.workedMinutes).toBe(0);
    expect(r.overtimeMinutes).toBe(0);
  });
});

describe('computeAttendance — worked time & overtime', () => {
  it('computes worked minutes minus break', () => {
    const r = computeAttendance({
      clockIn: at(9, 0),
      clockOut: at(17, 0),
      shift: { startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    });
    // 8h shift - 1h break = 7h = 420 min
    expect(r.workedMinutes).toBe(420);
    expect(r.overtimeMinutes).toBe(0);
  });

  it('computes overtime beyond standard shift length', () => {
    const r = computeAttendance({
      clockIn: at(9, 0),
      clockOut: at(19, 0), // 10h
      shift: { startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    });
    // worked 9h - 8h standard = 1h OT = 60 min
    expect(r.overtimeMinutes).toBe(60);
  });
});

describe('computeAttendance — night differential', () => {
  it('counts night minutes for a night shift', () => {
    const r = computeAttendance({
      clockIn: at(22, 0),
      clockOut: at(6, 0, 1), // next day
      shift: { startTime: '22:00', endTime: '06:00', isNightShift: true, breakMinutes: 0 },
    });
    // 22:00 -> 06:00 = 8h; night window 22:00-06:00 covers all 480 min.
    expect(r.workedMinutes).toBe(480);
    expect(r.nightMinutes).toBe(480);
  });

  it('counts only the portion inside the night window (22-06)', () => {
    const r = computeAttendance({
      clockIn: at(20, 0),
      clockOut: at(23, 0),
      shift: { startTime: '20:00', endTime: '04:00', isNightShift: true, breakMinutes: 0 },
    });
    // 20:00-23:00 = 180 min worked; night window covers 22:00-23:00 = 60 min.
    expect(r.workedMinutes).toBe(180);
    expect(r.nightMinutes).toBe(60);
  });
});

describe('computeAttendance — geo-fence', () => {
  // Dhaka Gulshan approx coordinates.
  const fence = { lat: 23.7807, lng: 90.4189, radiusMeters: 200 };

  it('verifies location inside the fence', () => {
    const r = computeAttendance({
      clockIn: at(9, 0),
      shift: { startTime: '09:00', endTime: '17:00' },
      geoLat: 23.7808,
      geoLng: 90.4189,
      geoFence: fence,
    });
    expect(r.geoVerified).toBe(true);
  });

  it('fails location far outside the fence', () => {
    const r = computeAttendance({
      clockIn: at(9, 0),
      shift: { startTime: '09:00', endTime: '17:00' },
      geoLat: 23.7,
      geoLng: 90.4,
      geoFence: fence,
    });
    expect(r.geoVerified).toBe(false);
  });

  it('fails when fence configured but no location captured', () => {
    const r = computeAttendance({
      clockIn: at(9, 0),
      shift: { startTime: '09:00', endTime: '17:00' },
      geoFence: fence,
    });
    expect(r.geoVerified).toBe(false);
  });

  it('haversine returns ~0 for identical points and increases with distance', () => {
    expect(haversineMeters(23.7807, 90.4189, 23.7807, 90.4189)).toBe(0);
    const d = haversineMeters(23.7807, 90.4189, 23.7907, 90.4189);
    expect(d).toBeGreaterThan(1000); // ~1.1 km north
  });
});
