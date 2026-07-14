import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";
import { BackgroundSyncPlugin, NetworkOnly } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const bgSyncPlugin = new BackgroundSyncPlugin("offline-attendance-queue", {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/trpc/attendance.clockIn'),
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    },
  ],
});

serwist.addEventListeners();

const sw = self as any;

sw.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new alert in EMS.',
    icon: '/icon.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.openWindow(event.notification.data.url)
  );
});
