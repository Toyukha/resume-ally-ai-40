import { useEffect, useRef, useState } from "react";
import { Download, Share, Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackPwaEvent } from "@/lib/pwa-analytics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "cb_install_dismissed_at";
const DISMISS_DAYS = 14;

function wasRecentlyDismissed() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

type IosInfo = {
  isIos: boolean;
  isSafari: boolean;
  version: number | null; // major version
};

function detectIos(): IosInfo {
  if (typeof window === "undefined") return { isIos: false, isSafari: false, version: null };
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect via touch points.
  const isIpadOs =
    /Macintosh/.test(ua) &&
    typeof navigator !== "undefined" &&
    (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints !== undefined &&
    ((navigator as unknown as { maxTouchPoints: number }).maxTouchPoints ?? 0) > 1;
  const iosLike = isIos || isIpadOs;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|Line|MicroMessenger/.test(ua);
  const match = ua.match(/OS (\d+)_/);
  const version = match ? Number(match[1]) : null;
  return { isIos: iosLike, isSafari, version };
}

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState<IosInfo>({ isIos: false, isSafari: false, version: null });
  const promptShownRef = useRef(false);
  const iosShownRef = useRef(false);
  const iosExpandedRef = useRef(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (wasRecentlyDismissed()) return;

    const info = detectIos();
    setIos(info);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!promptShownRef.current) {
        promptShownRef.current = true;
        void trackPwaEvent("prompt_shown");
      }
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
      void trackPwaEvent("installed");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let iosTimer: number | undefined;
    if (info.isIos) {
      iosTimer = window.setTimeout(() => {
        setShowIosHint(true);
        if (!iosShownRef.current) {
          iosShownRef.current = true;
          void trackPwaEvent("ios_hint_shown");
        }
      }, 3500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    if (deferred) void trackPwaEvent("prompt_dismissed");
    if (showIosHint) void trackPwaEvent("ios_hint_dismissed");
    setDeferred(null);
    setShowIosHint(false);
    setIosSheetOpen(false);
  };

  const openIosSheet = () => {
    setIosSheetOpen(true);
    if (!iosExpandedRef.current) {
      iosExpandedRef.current = true;
      void trackPwaEvent("ios_hint_expanded");
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    void trackPwaEvent(choice.outcome === "accepted" ? "prompt_accepted" : "prompt_dismissed");
    setDeferred(null);
  };

  if (installed) return null;

  if (deferred) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-50 flex justify-center md:inset-x-auto md:right-4 md:bottom-4">
        <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-border/60 bg-background/95 p-2 pl-4 shadow-2xl backdrop-blur-xl">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero shadow-glow">
            <Download className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold leading-tight">Install Career Boost</p>
            <p className="text-xs text-muted-foreground">Use it like a real app.</p>
          </div>
          <Button onClick={install} size="sm" className="gap-1.5" aria-label="Install Career Boost as an app">
            Install
          </Button>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!showIosHint) return null;

  // iOS: non-Safari browser cannot install → tell user to open in Safari.
  if (ios.isIos && !ios.isSafari) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-hero shadow-glow">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Install Career Boost</p>
            <p className="mt-1 text-muted-foreground">
              To install on iPhone, open <span className="font-medium text-foreground">thecareerboost.com</span> in{" "}
              <span className="font-medium text-foreground">Safari</span>, then use Share → Add to Home Screen.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install hint"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari but version too old for reliable PWA install.
  if (ios.isIos && ios.isSafari && ios.version !== null && ios.version < 12) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-hero shadow-glow">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Update iOS to install</p>
            <p className="mt-1 text-muted-foreground">
              Installing web apps needs iOS 12.2 or newer. You can still keep using Career Boost in Safari.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install hint"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tappable teaser card */}
      <div className="fixed inset-x-3 bottom-3 z-50 md:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={openIosSheet}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIosSheet(); } }}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/95 p-3 text-left shadow-2xl backdrop-blur-xl active:scale-[0.99] transition cursor-pointer"
          aria-label="Show how to install Career Boost on iPhone"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-hero shadow-glow">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold leading-tight">Install Career Boost</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Tap to see how to add it to your Home Screen.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Show me <ChevronRight className="h-3.5 w-3.5" />
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            aria-label="Dismiss install hint"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Full-screen walkthrough sheet */}
      {iosSheetOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIosSheetOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-border/60 bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Add to Home Screen</h2>
                <p className="text-sm text-muted-foreground">Three quick steps in Safari.</p>
              </div>
              <button
                onClick={() => setIosSheetOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <div>
                  <p className="font-medium text-foreground">
                    Tap the Share button <Share className="mx-1 inline h-4 w-4" />
                  </p>
                  <p className="text-muted-foreground">It's in Safari's bottom bar (or top-right on iPad).</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <div>
                  <p className="font-medium text-foreground">
                    Choose <span className="whitespace-nowrap">Add to Home Screen</span> <Plus className="mx-1 inline h-4 w-4" />
                  </p>
                  <p className="text-muted-foreground">Scroll down in the share sheet if you don't see it.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <div>
                  <p className="font-medium text-foreground">Tap Add</p>
                  <p className="text-muted-foreground">Career Boost will appear on your Home Screen like a real app.</p>
                </div>
              </li>
            </ol>

            <Button onClick={() => setIosSheetOpen(false)} className="mt-6 w-full" size="lg">
              Got it
            </Button>
            <button
              onClick={dismiss}
              className="mt-2 w-full rounded-md py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Don't show this again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
