import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CountrySelect, guessCountryFromTimezone } from "@/components/country-select";
import { toast } from "sonner";

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

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<string>(() => guessCountryFromTimezone());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
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
        emailRedirectTo: "https://thecareerboost.com/auth",
        data: { country_code: country },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email to confirm your account.");
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
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
