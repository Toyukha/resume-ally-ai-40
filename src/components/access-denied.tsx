import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AccessDenied() {
  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.replace("/dashboard");
  };
  return (
    <div role="alert" className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <Card className="w-full max-w-md p-8 text-center shadow-elegant">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to access the admin portal. This area is restricted to super administrators only.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
