import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { JobSearchInput } from "@/lib/jobs.functions";
import { COUNTRIES } from "@/lib/job-countries";
import { CATEGORIES, EXPERIENCE_LEVELS, EMPLOYMENT_TYPES, SORT_OPTIONS } from "@/lib/job-categories";

type Props = {
  value: JobSearchInput;
  onChange: (next: JobSearchInput) => void;
  onClear?: () => void;
  /** Hide controls that the parent already locks in (e.g. country on hub pages). */
  lockedKeys?: Array<keyof JobSearchInput>;
};

const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

function toggleArray<T extends string>(arr: T[] | undefined, v: T): T[] | undefined {
  const set = new Set(arr ?? []);
  if (set.has(v)) set.delete(v);
  else set.add(v);
  const next = [...set];
  return next.length ? next : undefined;
}

export function JobFiltersSidebar({ value, onChange, onClear, lockedKeys = [] }: Props) {
  const set = <K extends keyof JobSearchInput>(k: K, v: JobSearchInput[K]) => onChange({ ...value, [k]: v });
  const isLocked = (k: keyof JobSearchInput) => lockedKeys.includes(k);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary-glow" />
          Filters
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Title, skill, company…"
          value={value.query ?? ""}
          onChange={(e) => set("query", e.target.value || undefined)}
          className="pl-9"
        />
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <Select value={value.sort ?? "relevance"} onValueChange={(v) => set("sort", v as JobSearchInput["sort"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" defaultValue={["country", "work", "category"]} className="w-full">
        {!isLocked("country") && (
          <AccordionItem value="country" className="border-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">Country</AccordionTrigger>
            <AccordionContent>
              <Select
                value={value.country ?? "gb"}
                onValueChange={(v) => set("country", v as JobSearchInput["country"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.slug} value={c.adzuna}>
                      <span className="mr-2">{c.flag}</span>{c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Location (city, region…)"
                value={value.location ?? ""}
                onChange={(e) => set("location", e.target.value || undefined)}
                className="mt-2"
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {!isLocked("workTypes") && (
          <AccordionItem value="work" className="border-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">Work Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {WORK_TYPES.map((w) => {
                  const checked = (value.workTypes ?? []).includes(w.value);
                  return (
                    <label key={w.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => set("workTypes", toggleArray(value.workTypes, w.value))}
                      />
                      {w.label}
                    </label>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="category" className="border-border">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">Job Category</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-56 pr-2">
              <div className="space-y-2">
                {CATEGORIES.map((c) => {
                  const checked = (value.categories ?? []).includes(c.slug);
                  return (
                    <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => set("categories", toggleArray(value.categories, c.slug))}
                      />
                      <span>{c.emoji}</span>
                      <span>{c.label}</span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience" className="border-border">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">Experience Level</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((e) => {
                const checked = (value.experienceLevels ?? []).includes(e.slug);
                return (
                  <label key={e.slug} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => set("experienceLevels", toggleArray(value.experienceLevels, e.slug))}
                    />
                    {e.label}
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="employment" className="border-border">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">Employment Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {EMPLOYMENT_TYPES.map((e) => {
                const checked = (value.employmentTypes ?? []).includes(e.slug);
                return (
                  <label key={e.slug} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => set("employmentTypes", toggleArray(value.employmentTypes, e.slug))}
                    />
                    {e.label}
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="posted" className="border-border">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">Date Posted</AccordionTrigger>
          <AccordionContent>
            <Select
              value={value.postedWithinDays != null ? String(value.postedWithinDays) : "any"}
              onValueChange={(v) => set("postedWithinDays", v === "any" ? undefined : Number(v))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="1">Past 24 hours</SelectItem>
                <SelectItem value="7">Past week</SelectItem>
                <SelectItem value="30">Past month</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/** Mobile drawer wrapper — opens the sidebar in a sheet. */
export function JobFiltersMobile(props: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = countActive(props.value);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto sm:w-96">
        <SheetHeader className="mb-4">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <JobFiltersSidebar {...props} />
      </SheetContent>
    </Sheet>
  );
}

export function countActive(v: JobSearchInput): number {
  let n = 0;
  if (v.query) n++;
  if (v.location) n++;
  if (v.workTypes?.length) n += v.workTypes.length;
  if (v.categories?.length) n += v.categories.length;
  if (v.experienceLevels?.length) n += v.experienceLevels.length;
  if (v.employmentTypes?.length) n += v.employmentTypes.length;
  if (v.postedWithinDays) n++;
  if (v.sort && v.sort !== "relevance") n++;
  return n;
}

// Legacy compat — the old single-row filter, retained as a tiny re-export
// so any existing import still resolves.
export function JobFilters(props: Props) { return <JobFiltersSidebar {...props} />; }

// Tiny inline component used to render an active-filter chip elsewhere
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border border-primary-glow/40 bg-primary/10 px-2.5 py-0.5 text-xs text-primary-glow hover:bg-primary/20"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}
