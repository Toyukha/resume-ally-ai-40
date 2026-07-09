import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CountrySelect, guessCountryFromTimezone } from "@/components/country-select";
import { toast } from "sonner";
import { trackAuthEvent } from "@/lib/auth-analytics";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Career Boost" },
      { name: "description", content: "Sign in or create your Career Boost account to optimize your resume, generate cover letters, and track your applications." },
      { property: "og:title", content: "Sign in — Career Boost" },
      { property: "og:description", content: "Sign in or create your Career Boost account to optimize your resume, generate cover letters, and track your applications." },
      { property: "og:url", content: "https://thecareerboost.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/auth" }],
  }),
  component: AuthPage,
});

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your email";
  const shown = local.slice(0, Math.min(3, local.length));
  return `${shown}${"*".repeat(Math.max(1, local.length - shown.length))}@${domain}`;
}

function authRedirectUrl(): string {
  if (typeof window === "undefined") return "https://thecareerboost.com/auth";
  return `${window.location.origin}/auth`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<string>(() => guessCountryFromTimezone());
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkErrorCode, setLinkErrorCode] = useState<string | null>(null);
  const [linkErrorDescription, setLinkErrorDescription] = useState<string | null>(null);
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Handle the confirm-link callback (?code=... or #error=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode =
      url.searchParams.get("error_code") ||
      hashParams.get("error_code") ||
      url.searchParams.get("error") ||
      hashParams.get("error");
    const errorDescription =
      url.searchParams.get("error_description") ||
      hashParams.get("error_description");

    const cleanUrl = () => {
      const cleaned = new URL(window.location.href);
      ["code", "error", "error_code", "error_description", "state"].forEach((k) =>
        cleaned.searchParams.delete(k),
      );
      window.history.replaceState({}, "", cleaned.pathname + cleaned.search);
    };

    if (code) {
      (async () => {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        cleanUrl();
        if (error) {
          setLinkError(
            "We couldn't complete your email verification. The link may have expired or already been used.",
          );
          void trackAuthEvent("verify_callback_failed", {
            metadata: { reason: error.message ?? "exchange_failed" },
          });
        } else {
          toast.success("Email verified. Welcome!");
          void trackAuthEvent("verify_callback_success");
          navigate({ to: "/dashboard", replace: true });
        }
      })();
      return;
    }

    if (errorCode) {
      const friendly = /expired/i.test(errorCode) || /expired/i.test(errorDescription ?? "")
        ? "Your verification link has expired. Enter your email below and resend the verification email."
        : /access_denied/i.test(errorCode)
        ? "Access denied for this verification link. Enter your email below and resend the verification email."
        : "This verification link is no longer valid. Enter your email below and resend the verification email.";
      setLinkError(friendly);
      setLinkErrorCode(errorCode);
      setLinkErrorDescription(errorDescription ?? null);
      void trackAuthEvent("verify_callback_failed", {
        metadata: { error_code: errorCode, error_description: errorDescription ?? null },
      });
      cleanUrl();
    }
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const resendVerification = useCallback(async () => {
    if (!email) {
      toast.error("Enter your email above first.");
      return;
    }
    void trackAuthEvent("resend_verification_clicked", { email });
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
      void trackAuthEvent("resend_verification_failed", {
        email,
        metadata: { reason: error.message },
      });
    } else {
      toast.success(`Verification email sent to ${redactEmail(email)}.`);
      void trackAuthEvent("resend_verification_sent", { email });
      setNeedsConfirm(false);
      setLinkError(null);
      setSignupSentTo(email);
    }
  }, [email]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirm(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (!error) return;
    const msg = error.message || "";
    if (/email not confirmed/i.test(msg) || /confirm/i.test(msg)) {
      setNeedsConfirm(true);
    } else if (/invalid login credentials/i.test(msg)) {
      toast.error("Wrong email or password.");
    } else {
      toast.error(msg);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) {
      toast.error("Please select your country.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirectUrl(),
        data: { country_code: country },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSignupSentTo(email);
    setLinkError(null);
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-hero blur-3xl opacity-30" />
        <div className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-gold blur-3xl opacity-20" />
      </div>

      <div className="container mx-auto flex min-h-screen flex-col px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="flex flex-1 items-center justify-center py-8">
          <Card className="w-full max-w-md p-8 shadow-elegant">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-hero shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold">Welcome to Career Boost</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to start optimizing</p>
            </div>

            {linkError && (
              <div
                role="alert"
                className="mb-4 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-foreground">{linkError}</p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-destructive"
                    onClick={resendVerification}
                    disabled={resending}
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </Button>
                </div>
              </div>
            )}

            {signupSentTo && (
              <div
                role="status"
                className="mb-4 flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-foreground">
                    Check <strong>{redactEmail(signupSentTo)}</strong> for a link to confirm your account.
                  </p>
                  <p className="text-muted-foreground">
                    Didn&apos;t get it?{" "}
                    <button
                      type="button"
                      onClick={resendVerification}
                      disabled={resending}
                      className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-60"
                    >
                      {resending ? "Sending…" : "Resend"}
                    </button>
                  </p>
                </div>
              </div>
            )}

            <Tabs defaultValue="signin">
              <TabsList className="grid h-11 w-full grid-cols-2">
                <TabsTrigger value="signin" className="h-9">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="h-9">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4 pt-4">
                  <Field id="email" label="Email" type="email" icon={Mail} value={email} onChange={setEmail} />
                  <Field id="password" label="Password" type="password" icon={Lock} value={password} onChange={setPassword} isPassword />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          toast.error("Please enter your email first.");
                          return;
                        }
                        setLoading(true);
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        setLoading(false);
                        if (error) toast.error(error.message);
                        else toast.success("Check your email for a reset link.");
                      }}
                      className="min-h-9 py-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  {needsConfirm && (
                    <div
                      role="alert"
                      className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="flex-1">
                        <p className="text-foreground">
                          We haven&apos;t verified this email yet. Check your inbox for the confirmation link, or resend it.
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0"
                          onClick={resendVerification}
                          disabled={resending}
                        >
                          {resending ? "Sending…" : "Resend verification email"}
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4 pt-4">
                  <Field id="email2" label="Email" type="email" icon={Mail} value={email} onChange={setEmail} />
                  <Field id="password2" label="Password" type="password" icon={Lock} value={password} onChange={setPassword} minLength={6} isPassword />
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <CountrySelect id="country" value={country} onChange={setCountry} />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, type, icon: Icon, value, onChange, minLength, isPassword }: {
  id: string; label: string; type: string; icon: typeof Mail;
  value: string; onChange: (v: string) => void; minLength?: number; isPassword?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id} type={inputType} required value={value} minLength={minLength}
          onChange={(e) => onChange(e.target.value)} className={isPassword ? "pl-9 pr-10" : "pl-9"}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
