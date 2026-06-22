import type { JobSearchInput } from "@/lib/jobs.functions";

type Preset = {
  id: string;
  label: string;
  emoji: string;
  patch: Partial<JobSearchInput>;
};

const PRESETS: Preset[] = [
  { id: "remote",  label: "Remote",            emoji: "🌍", patch: { workTypes: ["remote"], country: "gb" } },
  { id: "uk",      label: "UK Jobs",           emoji: "🇬🇧", patch: { country: "gb", workTypes: undefined } },
  { id: "us",      label: "US Jobs",           emoji: "🇺🇸", patch: { country: "us", workTypes: undefined } },
  { id: "canada",  label: "Canada Jobs",       emoji: "🇨🇦", patch: { country: "ca", workTypes: undefined } },
  { id: "nigeria", label: "Nigeria Jobs",      emoji: "🇳🇬", patch: { country: "gb", location: "Nigeria" } },
  { id: "cs",      label: "Customer Success",  emoji: "💼", patch: { categories: ["customer-success"] } },
  { id: "da",      label: "Data Analyst",      emoji: "📊", patch: { categories: ["data-analysis"] } },
  { id: "ux",      label: "UI/UX Design",      emoji: "🎨", patch: { categories: ["ui-ux"] } },
  { id: "se",      label: "Software Engineer", emoji: "💻", patch: { categories: ["software-engineering"] } },
  { id: "mk",      label: "Marketing",         emoji: "📈", patch: { categories: ["marketing"] } },
  { id: "sa",      label: "Sales",             emoji: "🎯", patch: { categories: ["sales"] } },
];

export function QuickFilterCards({
  onApply,
  current,
}: {
  onApply: (patch: Partial<JobSearchInput>) => void;
  current: JobSearchInput;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">
      {PRESETS.map((p) => {
        const active = isActive(current, p);
        return (
          <button
            key={p.id}
            onClick={() => onApply(p.patch)}
            className={`group inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
              active
                ? "border-primary-glow bg-primary/15 text-primary-glow shadow-glow"
                : "border-border bg-card/40 text-foreground hover:border-primary-glow/40 hover:bg-card/60"
            }`}
          >
            <span className="text-base leading-none">{p.emoji}</span>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function isActive(current: JobSearchInput, preset: Preset): boolean {
  const p = preset.patch;
  if (p.country && current.country !== p.country) return false;
  if (p.workTypes && JSON.stringify(p.workTypes) !== JSON.stringify(current.workTypes ?? null)) return false;
  if (p.location && current.location?.toLowerCase() !== p.location.toLowerCase()) return false;
  if (p.categories && !p.categories.every((c) => current.categories?.includes(c))) return false;
  return true;
}
