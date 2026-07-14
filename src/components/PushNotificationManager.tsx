'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Use the public key from env
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      // Save to Supabase User Profile
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub }),
        });
      }
      setMessage('Successfully subscribed!');
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      setMessage('Failed to subscribe.');
    }
  }

  async function unsubscribeFromPush() {
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      
      // Remove from backend
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch('/api/notifications/unsubscribe', { method: 'POST' });
      }
      setMessage('Successfully unsubscribed.');
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {subscription ? (
        <button 
          onClick={unsubscribeFromPush}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--verify-green)]/10 text-[var(--verify-green)] border border-[var(--verify-green)]/30 text-xs font-mono font-bold hover:bg-[var(--verify-green)] hover:text-black transition-all"
        >
          <Bell size={14} /> Notifications On
        </button>
      ) : (
        <button 
          onClick={subscribeToPush}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-[var(--text-muted)] border border-white/10 text-xs font-mono font-bold hover:text-white hover:bg-white/10 transition-all"
        >
          <BellOff size={14} /> Enable Notifications
        </button>
      )}
    </div>
  );
}
