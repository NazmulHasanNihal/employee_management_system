'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RealtimeOptions {
  room: string;
  onMessage?: (data: any) => void;
}

interface RealtimeApi {
  send: (data: unknown) => void;
  connected: boolean;
}

/**
 * Real-time presence/broadcast over Supabase Realtime (replaces PartyKit).
 *
 * Drop-in replacement for the old `usePartySocket` hook: same `{ send,
 * connected }` API and `onMessage` callback, so call sites don't change their
 * logic. Uses a Supabase Realtime broadcast channel per `room` — no extra
 * service, works in both dev and prod because it rides on your Supabase
 * project (which is already provisioned).
 *
 * Requires Supabase Realtime to be enabled for the project (Dashboard →
 * Database → Replication → supabase_realtime, or it's on by default for new
 * projects). The channel uses anonymous auth; broadcast payloads are not
 * row-level-secured, so only send non-sensitive signals (e.g. "someone
 * punched", "leave updated") — never PII.
 */
export default function useRealtimePresence({ room, onMessage }: RealtimeOptions): RealtimeApi {
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const supabase = createClient();
    const channel = supabase.channel(`ems:${room}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'msg' }, (payload: any) => {
        onMessageRef.current?.(payload.payload);
      })
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setConnected(false);
    };
  }, [room]);

  const send = useCallback((data: unknown) => {
    const channel = channelRef.current;
    if (!channel) return;
    // Accept either a raw string (legacy callers JSON.stringify first) or an
    // object (AttendanceClient passes objects) — normalise to an object.
    const payload = typeof data === 'string' ? safeParse(data) : data;
    channel.send({ type: 'broadcast', event: 'msg', payload });
  }, []);

  return { send, connected };
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
