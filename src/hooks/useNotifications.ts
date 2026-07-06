import { useEffect, useState, useCallback } from "react";
import { useHousehold } from "./useHousehold";
import {
  requestNotificationPermission,
  getTodayNotificationCount,
} from "@/services/notifications";
import { registerFCMToken } from "@/lib/firebase";

export function useNotifications() {
  const { householdId, isReady } = useHousehold();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );
  const [todayCount, setTodayCount] = useState(0);
  const [fcmReady, setFcmReady] = useState(false);

  const refreshCount = useCallback(() => {
    if (!householdId) return;
    getTodayNotificationCount(householdId)
      .then(setTodayCount)
      .catch(console.error);
  }, [householdId]);

  useEffect(() => {
    if (!isReady || !householdId) return;
    refreshCount();
  }, [isReady, householdId, refreshCount]);

  // ลงทะเบียน FCM token เมื่อ permission granted
  useEffect(() => {
    if (permission !== "granted" || fcmReady) return;
    registerFCMToken()
      .then((token) => {
        if (token) setFcmReady(true);
      })
      .catch(console.error);
  }, [permission, fcmReady]);

  const requestPermission = useCallback(async () => {
    const p = await requestNotificationPermission();
    setPermission(p);
    if (p === "granted") {
      registerFCMToken()
        .then((token) => {
          if (token) setFcmReady(true);
        })
        .catch(console.error);
    }
    return p;
  }, []);

  return { permission, requestPermission, todayCount, refreshCount, fcmReady };
}
