// Lesreg Partners — service worker.
// Deliberately MINIMAL: it makes the page installable (PWA) and handles Web Push.
// It does NOT cache assets, so the live page is never served stale after a deploy
// (a no-op fetch handler is present only to satisfy install criteria).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* network passthrough — no caching */ });

// Web Push → show the notification (works even when the app is closed).
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { d = { body: event.data && event.data.text() }; }
  const title = d.title || 'New partner application';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Someone just applied.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'partner-application',
    renotify: true,
    data: { url: d.url || 'partner.html?view=approvals' },
  }));
});

// Tapping the notification → focus (or open) the app on the approval view.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'partner.html?view=approvals';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if (c.url.includes('partner.html')) { await c.focus(); c.postMessage({ view: 'approvals' }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
