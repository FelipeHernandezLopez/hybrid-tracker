// ═══════════════════════════════════════════
//  SUB-2 × HYROX — Service Worker
//  Handles local scheduled notifications
// ═══════════════════════════════════════════

const SW_VERSION = 'sub2hyrox-sw-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ── Timer management ──────────────────────
let _timers = [];

function clearAllTimers() {
  _timers.forEach(clearTimeout);
  _timers = [];
}

function msUntil(hour, min = 0) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, min, 0, 0);
  // If the time already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function fireNotification(title, body, tag) {
  self.registration.showNotification(title, {
    body,
    icon:    '/sub2_hyrox_logo_v1_badge.svg',
    badge:   '/sub2_hyrox_logo_v1_badge.svg',
    tag,                 // collapses duplicates with same tag
    renotify: false,
    vibrate: [200, 100, 200],
    data: { url: '/' }
  });
}

function schedule(delayMs, title, body, tag) {
  if (delayMs < 0) return;
  const t = setTimeout(() => fireNotification(title, body, tag), delayMs);
  _timers.push(t);
}

// ── Message from app → schedule the day ──
self.addEventListener('message', e => {
  if (e.data?.type !== 'SCHEDULE_NOTIFICATIONS') return;

  clearAllTimers();

  const { quote, author, sessionLine, dayType } = e.data;

  // ① 5:00 AM — Daily quote
  schedule(
    msUntil(5, 0),
    'SUB-2 × HYROX · Good morning',
    `"${quote}" — ${author}`,
    'notif-quote'
  );

  // ② 7:00 AM — Today's sessions
  const sessionTitle = dayType === 'rest'
    ? '😴 Rest day — recover well'
    : dayType === 'double'
      ? '💪💪 Double session day'
      : '💪 Training today';
  schedule(
    msUntil(7, 0),
    sessionTitle,
    sessionLine,
    'notif-sessions'
  );

  // ③ 12:00 PM — Water reminder
  schedule(
    msUntil(12, 0),
    '💧 Midday water check',
    'How many glasses so far? Keep sipping — goal is 10 today.',
    'notif-water'
  );

  // ④ 6:00 PM — Calorie & macros reminder
  schedule(
    msUntil(18, 0),
    '🥗 Calorie check',
    'Have you logged your meals? Check your macro targets before dinner.',
    'notif-macros'
  );

  // ⑤ 8:00 PM — Evening habits
  schedule(
    msUntil(20, 0),
    '🌙 Evening habits',
    'Log your sleep score, tick off your habits, and don\'t forget your supplements.',
    'notif-habits'
  );
});

// ── Notification click → open the app ────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Focus existing window if already open
        const existing = list.find(c => c.url.includes(self.location.origin));
        if (existing) return existing.focus();
        // Otherwise open a new window
        return clients.openWindow('/');
      })
  );
});
