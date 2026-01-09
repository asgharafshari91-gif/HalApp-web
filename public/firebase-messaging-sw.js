/* public/firebase-messaging-sw.js */
/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// ✅ ENV buraya yazılmaz. Firebase config sabit (console’dan aldığın web config)
// Not: NEXT_PUBLIC_* SW içinde yok. O yüzden manuel config şart.
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  // measurementId opsiyonel
});

const messaging = firebase.messaging();

/**
 * Payload’dan link çıkar:
 * - payload.data.link (bizim önerilen)
 * - payload.fcmOptions.link (FCM)
 * - payload.notification.click_action (legacy)
 */
function pickLink(payload) {
  const d = (payload && payload.data) || {};
  const n = (payload && payload.notification) || {};
  const fcmOpt = (payload && payload.fcmOptions) || {};

  return (
    d.link ||
    fcmOpt.link ||
    n.click_action ||
    d.click_action ||
    "/"
  );
}

function pickTitle(payload) {
  return (
    (payload && payload.notification && payload.notification.title) ||
    (payload && payload.data && payload.data.title) ||
    "HalApp"
  );
}

function pickBody(payload) {
  return (
    (payload && payload.notification && payload.notification.body) ||
    (payload && payload.data && payload.data.body) ||
    "Yeni bildirimin var."
  );
}

function pickIcon(payload) {
  const d = (payload && payload.data) || {};
  return d.icon || "/apple-touch-icon.png";
}

function pickBadge(payload) {
  const d = (payload && payload.data) || {};
  return d.badge || "/badge.png";
}

/**
 * ✅ Background message handler
 * - Bildirim göster
 * - data içine link ve payload göm (tıklama için)
 */
messaging.onBackgroundMessage((payload) => {
  const title = pickTitle(payload);
  const body = pickBody(payload);
  const link = pickLink(payload);
  const icon = pickIcon(payload);
  const badge = pickBadge(payload);

  const data = {
    link,
    // debug için komple payload saklamak istersen:
    payload,
  };

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    data,
    // mobilde daha iyi:
    renotify: false,
    tag: (payload && payload.data && payload.data.tag) || "halapp",
  });
});

/**
 * ✅ Bildirime tıklanınca:
 * - açık tab varsa focus
 * - yoksa yeni tab aç
 * - sonra linke yönlendir (same-origin ise navigate)
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = (event.notification && event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // aynı origin hedef
      const targetUrl = new URL(link, self.location.origin).toString();

      // açık tab bul -> focus + navigate
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          const isSameOrigin = clientUrl.origin === self.location.origin;

          if (isSameOrigin) {
            await client.focus();
            // navigate destekliyse yönlendir
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            } else {
              // fallback: postMessage ile yönlendirme (client tarafında handle edebilirsin)
              client.postMessage({ type: "HALAPP_NAVIGATE", url: targetUrl });
            }
            return;
          }
        } catch {}
      }

      // hiç tab yoksa yeni aç
      await clients.openWindow(targetUrl);
    })()
  );
});