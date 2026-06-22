import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Mail, Lock, ArrowLeft, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/employer/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create Employer Account — Career Boost" },
      { name: "description", content: "Create your Career Boost Employer account to post jobs, screen candidates with AI, and manage your hiring pipeline." },
    ],
  }),
  component: EmployerSignup,
});

function EmployerSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/employer/onboarding", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/employer/onboarding",
        data: { full_name: fullName, intended_company_name: companyName || undefined, account_type: "employer" },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (companyName) {
      try { localStorage.setItem("pendingCompanyName", companyName); } catch {}
    }
    if (data.session) {
      toast.success("Account created. Let's set up your company.");
      navigate({ to: "/employer/onboarding", replace: true });
    } else {
      toast.success("Check your email to confirm your account.");
    }
  };

  const googleSignUp = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/employer/onboarding",
    });
    if (result.error) {
      setLoading(false);
      return toast.error(result.error.message ?? "Google sign-up failed");
    }
    if (result.redirected) return;
    navigate({ to: "/employer/onboarding", replace: true });
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <Card className="p-8 shadow-elegant">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-hero text-primary-foreground shadow-glow">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-bold">Create Employer Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start posting jobs and screening candidates with AI</p>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={googleSignUp} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Sign up with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" placeholder="Jane Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company name <span className="text-muted-foreground">(optional)</span></Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-9" placeholder="Acme Inc." />
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create Employer Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link to="/employer/login" className="font-semibold text-primary-glow hover:underline">Sign in</Link>
          </p>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Looking for a job?{" "}
          <Link to="/auth" className="underline-offset-2 hover:underline">Job seeker sign in</Link>
        </p>
      </div>
    </div>
  );
}
