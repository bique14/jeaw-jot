import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Persistent cache รองรับหลาย tabs + offline
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// FCM — ใช้ได้เฉพาะ browser ที่รองรับ
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};

/**
 * ลงทะเบียน FCM token สำหรับรับ background push
 * ต้องการ VITE_FIREBASE_VAPID_KEY ใน .env.local
 * (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)
 */
export async function registerFCMToken(): Promise<string | null> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as
    | string
    | undefined;
  if (!vapidKey) return null;

  const supported = await isSupported();
  if (!supported) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js",
    );
    const registration =
      existing ??
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    // ส่ง firebase config ไปให้ service worker รู้จัก project
    registration.active?.postMessage({
      type: "FIREBASE_CONFIG",
      config: firebaseConfig,
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch {
    return null;
  }
}
