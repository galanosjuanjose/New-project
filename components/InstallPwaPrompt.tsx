"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);

    // navigator.userAgent is only available in the browser, so this can't be
    // read during the server render — sync it in on mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !("MSStream" in window));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || (!deferredPrompt && !isIos)) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-2xl bg-camel px-4 py-3 text-sm text-chocolate shadow-lg sm:inset-x-auto sm:right-6 sm:max-w-sm">
      <span>
        {isIos
          ? "Install Keto Kitchen: tap Share, then \"Add to Home Screen\"."
          : "Install Keto Kitchen for quick access and reminders."}
      </span>
      <div className="flex shrink-0 gap-2">
        {deferredPrompt && (
          <button
            onClick={async () => {
              await deferredPrompt.prompt();
              setDeferredPrompt(null);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-oro-viejo px-4 text-xs text-cream"
          >
            Install
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="inline-flex min-h-11 items-center justify-center px-2 text-xs text-cafe"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
