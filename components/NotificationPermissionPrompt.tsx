"use client";

import { useEffect, useState } from "react";
import { notificationPermission, requestNotificationPermission } from "@/lib/notifications/browserNotify";

export function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    // Notification.permission only exists in the browser, so this can't be
    // read during the server render — sync it in on mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(notificationPermission());
  }, []);

  if (permission !== "default") return null;

  return (
    <button
      onClick={async () => setPermission(await requestNotificationPermission())}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-arena px-4 text-xs text-cafe hover:bg-camel/40"
    >
      Enable snack reminders
    </button>
  );
}
