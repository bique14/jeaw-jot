// Firebase Messaging Service Worker
// ไฟล์นี้จัดการ background push notification จาก FCM
// เมื่อ app ปิดอยู่แต่ browser ยังทำงาน

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
);

// Firebase config จะถูก inject ตอน runtime ผ่าน postMessage
// หรือ hardcode ที่นี่ (ไม่มี env vars ใน SW)
let messaging = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    const app = firebase.initializeApp(event.data.config);
    messaging = firebase.messaging(app);

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon } = payload.notification ?? {};
      self.registration.showNotification(title ?? "Jeaw", {
        body: body ?? "",
        icon: icon ?? "/icon-192.png",
        badge: "/icon-192.png",
        tag: payload.collapseKey ?? "jeaw-notif",
        data: payload.data,
      });
    });
  }
});

// Handle notification click — เปิด app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow("/");
      }),
  );
});
