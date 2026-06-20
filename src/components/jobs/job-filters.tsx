import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADZUNA_COUNTRIES, type JobSearchInput } from "@/lib/jobs.functions";

const COUNTRY_LABELS: Record<string, string> = {
  gb: "United Kingdom", us: "United States", de: "Germany", fr: "France", nl: "Netherlands",
  ca: "Canada", au: "Australia", in: "India", za: "South Africa", br: "Brazil",
  pl: "Poland", it: "Italy", es: "Spain", sg: "Singapore", nz: "New Zealand",
  mx: "Mexico", at: "Austria", ch: "Switzerland", be: "Belgium",
};

type Props = {
  value: JobSearchInput;
  onChange: (next: JobSearchInput) => void;
};

export function JobFilters({ value, onChange }: Props) {
  const set = <K extends keyof JobSearchInput>(k: K, v: JobSearchInput[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card/40 p-4 md:grid-cols-12">
      <div className="relative md:col-span-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search role, skill, keyword…"
          value={value.query ?? ""}
          onChange={(e) => set("query", e.target.value)}
          className="pl-9"
        />
      </div>
      <Input
        placeholder="Location"
        value={value.location ?? ""}
        onChange={(e) => set("location", e.target.value)}
        className="md:col-span-2"
      />
      <Select value={value.remote ?? "any"} onValueChange={(v) => set("remote", v as JobSearchInput["remote"])}>
        <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Work mode" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any mode</SelectItem>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="hybrid">Hybrid</SelectItem>
          <SelectItem value="onsite">Onsite</SelectItem>
        </SelectContent>
      </Select>
      <Select value={value.employmentType ?? "any"} onValueChange={(v) => set("employmentType", v === "any" ? undefined : v)}>
        <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any type</SelectItem>
          <SelectItem value="full-time">Full-time</SelectItem>
          <SelectItem value="part-time">Part-time</SelectItem>
          <SelectItem value="contract">Contract</SelectItem>
          <SelectItem value="internship">Internship</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={value.postedWithinDays != null ? String(value.postedWithinDays) : "any"}
        onValueChange={(v) => set("postedWithinDays", v === "any" ? undefined : Number(v))}
      >
        <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Posted" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any time</SelectItem>
          <SelectItem value="1">Past 24h</SelectItem>
          <SelectItem value="7">Past week</SelectItem>
          <SelectItem value="30">Past month</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={value.country ?? "gb"}
        onValueChange={(v) => set("country", v as JobSearchInput["country"])}
      >
        <SelectTrigger className="md:col-span-12"><SelectValue placeholder="Country (Adzuna)" /></SelectTrigger>
        <SelectContent className="max-h-72">
          {ADZUNA_COUNTRIES.map((c) => (
            <SelectItem key={c} value={c}>{COUNTRY_LABELS[c] ?? c.toUpperCase()}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
