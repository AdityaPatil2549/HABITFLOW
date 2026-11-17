import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_STORAGE_KEY = 'habitflow_pwa_install_dismissed';

function checkStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  // @ts-expect-error - navigator.standalone is iOS Safari specific
  const isStandaloneNavigator = Boolean(window.navigator.standalone);
  return isStandaloneMedia || isStandaloneNavigator;
}

function checkIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !('MSStream' in window);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkStandalone());
  const [isIOS] = useState<boolean>(() => checkIsIOS());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(DISMISS_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    // Listen for beforeinstallprompt (Chromium / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Failed to trigger install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
  }, []);

  const resetDismissal = useCallback(() => {
    setIsDismissed(false);
    localStorage.removeItem(DISMISS_STORAGE_KEY);
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) || (isIOS && !isInstalled),
    isNativePromptReady: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isDismissed,
    promptInstall,
    dismissPrompt,
    resetDismissal,
  };
}
