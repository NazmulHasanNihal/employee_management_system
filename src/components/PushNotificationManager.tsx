'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

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

  const saveSubMutation = trpc.notifications.savePushSub.useMutation();
  const removeSubMutation = trpc.notifications.removePushSub.useMutation();

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      saveSubMutation.mutate({ subscription: sub });
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
      
      removeSubMutation.mutate({});
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/30 text-xs font-mono font-bold hover:bg-[var(--emerald)] hover:text-black transition-all"
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
