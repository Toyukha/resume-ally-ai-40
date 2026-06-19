import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { JobsTabs } from "@/components/jobs/jobs-tabs";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Career Boost" }] }),
  component: JobsLayout,
});

function JobsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Jobs Marketplace</h1>
          <p className="mt-1 text-muted-foreground">
            Discover roles, analyze your fit, and track every application — all in one place.
          </p>
        </div>
        <JobsTabs />
        <Outlet />
      </main>
    </div>
  );
}
