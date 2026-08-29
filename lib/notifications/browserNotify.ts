export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  return Notification.requestPermission();
}

/** Shows a browser Notification while the tab/PWA is open/foregrounded. Silently
 * no-ops if unsupported or not permitted — this is intentionally not push. */
export function showNudge(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icons/icon-192.png" });
}
