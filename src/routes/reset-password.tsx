import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Career Boost" },
      { name: "description", content: "Set a new password for your Career Boost account." },
      { property: "og:title", content: "Reset password — Career Boost" },
      { property: "og:description", content: "Set a new password for your Career Boost account." },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hashParams, setHashParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Parse hash fragment parameters (type=recovery & access_token=...)
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const entries: Record<string, string> = {};
    params.forEach((value, key) => {
      entries[key] = value;
    });
    setHashParams(entries);

    // If no recovery token is present, redirect to auth
    if (entries.type !== "recovery" && !entries.access_token) {
      toast.error("Invalid or expired reset link.");
      navigate({ to: "/auth", replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully.");
      navigate({ to: "/auth", replace: true });
    }
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
              <h1 className="font-display text-2xl font-bold">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Enter a new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    placeholder="Repeat your password"
                  />
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
