const c = "wifi-monitor-v1", s = [
  "/",
  "/index.html",
  "/config.json",
  "/sounds/notification.mp3",
  "/vite.svg"
];
self.addEventListener("install", (e) => {
  console.log("Service Worker installing..."), e.waitUntil(
    caches.open(c).then((t) => (console.log("Opened cache"), t.addAll(s)))
  ), self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  console.log("Service Worker activating..."), e.waitUntil(
    caches.keys().then((t) => Promise.all(
      t.map((i) => {
        if (i !== c)
          return console.log("Deleting old cache:", i), caches.delete(i);
      })
    ))
  ), self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((t) => t || fetch(e.request))
  );
});
self.addEventListener("sync", (e) => {
  console.log("Background sync triggered:", e.tag), e.tag === "wifi-check" && e.waitUntil(a());
});
self.addEventListener("message", (e) => {
  console.log("Service Worker received message:", e.data);
  const { type: t, payload: i } = e.data;
  switch (t) {
    case "SHOW_NOTIFICATION":
      r(i);
      break;
    case "REGISTER_SYNC":
      l();
      break;
    case "UPDATE_CONFIG":
      d(i);
      break;
    default:
      console.log("Unknown message type:", t);
  }
});
self.addEventListener("notificationclick", (e) => {
  console.log("Notification clicked:", e.notification.tag), e.notification.close(), e.waitUntil(
    clients.matchAll({ type: "window" }).then((t) => {
      for (const i of t)
        if (i.url === self.location.origin && "focus" in i)
          return i.focus();
      if (clients.openWindow)
        return clients.openWindow("/");
    })
  );
});
self.addEventListener("push", (e) => {
  if (console.log("Push message received:", e), e.data) {
    const t = e.data.json();
    e.waitUntil(
      self.registration.showNotification(t.title, {
        body: t.body,
        icon: "/vite.svg",
        badge: "/vite.svg",
        tag: t.tag || "wifi-monitor",
        requireInteraction: !0,
        actions: [
          {
            action: "acknowledge",
            title: "Acknowledge"
          },
          {
            action: "snooze",
            title: "Snooze 5min"
          }
        ]
      })
    );
  }
});
async function r(e) {
  try {
    await self.registration.showNotification(e.title, {
      body: e.body,
      icon: e.icon || "/vite.svg",
      badge: "/vite.svg",
      tag: e.tag || "wifi-monitor",
      requireInteraction: e.requireInteraction || !1,
      silent: !1,
      actions: [
        {
          action: "acknowledge",
          title: "OK"
        }
      ]
    });
  } catch (t) {
    console.error("Failed to show notification:", t);
  }
}
async function a() {
  try {
    (await self.clients.matchAll()).forEach((t) => {
      t.postMessage({
        type: "BACKGROUND_WIFI_CHECK",
        timestamp: Date.now()
      });
    });
  } catch (e) {
    console.error("Error in background WiFi check:", e);
  }
}
function l() {
  "serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype && self.registration.sync.register("wifi-check");
}
let o = null;
function d(e) {
  o = e, console.log("Service Worker config updated:", o);
}
let n;
function f() {
  n = setInterval(() => {
    a();
  }, 6e4);
}
function g() {
  n && (clearInterval(n), n = null);
}
self.addEventListener("activate", () => {
  f();
});
self.addEventListener("beforeunload", () => {
  g();
});
console.log("WiFi Monitor Service Worker loaded");
