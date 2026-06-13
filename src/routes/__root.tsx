import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AiChatWidget } from "@/components/ai-chat-widget";


import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "rB7Ap5LymVR8XCym6BiTkIr17uwjWbkvf-xHGbNXRcM" },
      { title: "Career Boost — AI Resume Optimizer" },
      { name: "description", content: "Career Boost is your AI career coach—optimize your CV, beat ATS systems, generate cover letters, and land more interviews." },
      { property: "og:site_name", content: "Career Boost" },
      { property: "og:title", content: "Career Boost — AI Resume Optimizer" },
      { property: "og:description", content: "Career Boost is your AI career coach—optimize your CV, beat ATS systems, generate cover letters, and land more interviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Career Boost — AI Resume Optimizer" },
      { name: "twitter:description", content: "Career Boost is your AI career coach—optimize your CV, beat ATS systems, generate cover letters, and land more interviews." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/2ol1ORJhQXPJl9ggRkXm0n4dsRc2/social-images/social-1780936156818-ChatGPT_Image_Jun_8,_2026,_05_27_56_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/2ol1ORJhQXPJl9ggRkXm0n4dsRc2/social-images/social-1780936156818-ChatGPT_Image_Jun_8,_2026,_05_27_56_PM.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&family=Epilogue:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://thecareerboost.com/#organization",
              name: "Career Boost",
              url: "https://thecareerboost.com/",
              logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/2ol1ORJhQXPJl9ggRkXm0n4dsRc2/social-images/social-1780936156818-ChatGPT_Image_Jun_8,_2026,_05_27_56_PM.webp",
            },
            {
              "@type": "WebSite",
              "@id": "https://thecareerboost.com/#website",
              name: "Career Boost",
              url: "https://thecareerboost.com/",
              publisher: { "@id": "https://thecareerboost.com/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
      <WhatsAppButton variant="fab" location="floating_button" />
    </QueryClientProvider>
  );
}
