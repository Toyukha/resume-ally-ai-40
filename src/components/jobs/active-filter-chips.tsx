import { FilterChip } from "./job-filters";
import type { JobSearchInput } from "@/lib/jobs.functions";
import { CATEGORY_BY_SLUG, EXPERIENCE_LEVELS } from "@/lib/job-categories";
import { COUNTRIES } from "@/lib/job-countries";

const COUNTRY_BY_ADZUNA = Object.fromEntries(COUNTRIES.map((c) => [c.adzuna, c]));

export function ActiveFilterChips({
  value,
  onChange,
}: {
  value: JobSearchInput;
  onChange: (v: JobSearchInput) => void;
}) {
  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  const remove = <K extends keyof JobSearchInput>(k: K, v?: JobSearchInput[K]) =>
    onChange({ ...value, [k]: v });

  if (value.query) chips.push({ key: "q", label: `"${value.query}"`, remove: () => remove("query", undefined) });
  if (value.location) chips.push({ key: "loc", label: `📍 ${value.location}`, remove: () => remove("location", undefined) });
  if (value.country && value.country !== "gb") {
    const c = COUNTRY_BY_ADZUNA[value.country];
    if (c) chips.push({ key: "country", label: `${c.flag} ${c.label}`, remove: () => remove("country", undefined) });
  }
  for (const w of value.workTypes ?? []) {
    chips.push({
      key: `w-${w}`,
      label: w[0].toUpperCase() + w.slice(1),
      remove: () => remove("workTypes", (value.workTypes ?? []).filter((x) => x !== w)),
    });
  }
  for (const c of value.categories ?? []) {
    const cat = CATEGORY_BY_SLUG[c];
    if (cat) chips.push({
      key: `c-${c}`,
      label: `${cat.emoji} ${cat.label}`,
      remove: () => remove("categories", (value.categories ?? []).filter((x) => x !== c)),
    });
  }
  for (const e of value.experienceLevels ?? []) {
    const lvl = EXPERIENCE_LEVELS.find((x) => x.slug === e);
    if (lvl) chips.push({
      key: `e-${e}`,
      label: lvl.label,
      remove: () => remove("experienceLevels", (value.experienceLevels ?? []).filter((x) => x !== e)),
    });
  }
  for (const e of value.employmentTypes ?? []) {
    chips.push({
      key: `et-${e}`,
      label: e.replace("-", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      remove: () => remove("employmentTypes", (value.employmentTypes ?? []).filter((x) => x !== e)),
    });
  }
  if (value.postedWithinDays) {
    chips.push({
      key: "posted",
      label: `Past ${value.postedWithinDays}d`,
      remove: () => remove("postedWithinDays", undefined),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => <FilterChip key={c.key} label={c.label} onRemove={c.remove} />)}
    </div>
  );
}
