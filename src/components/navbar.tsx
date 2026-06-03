import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-hero shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>ResumeForge</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          {user && (
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" variant="hero" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
