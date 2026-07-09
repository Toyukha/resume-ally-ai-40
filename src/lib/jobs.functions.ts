import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { CATEGORY_BY_SLUG, EXPERIENCE_LEVELS } from "./job-categories";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export type NormalizedJob = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: string;
  postedAt: string;
  url: string;
  description: string;
  tags: string[];
  provider:
    | "arbeitnow"
    | "adzuna"
    | "himalayas"
    | "remotejobs"
    | "remotive"
    | "remoteok"
    | "jobicy"
    | "wwr"
    | "company";
};

export const ADZUNA_COUNTRIES = [
  "gb", "us", "de", "fr", "nl", "ca", "au", "in", "za", "br",
  "pl", "it", "es", "sg", "nz", "mx", "at", "ch", "be",
] as const;
export type AdzunaCountry = (typeof ADZUNA_COUNTRIES)[number];

// ────────────────────────────────────────────────────────────────────────────
// Arbeitnow client (server-side, with simple in-memory cache)
// ────────────────────────────────────────────────────────────────────────────

type ArbeitnowJob = {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
};

const cache = new Map<string, { at: number; data: NormalizedJob[] }>();
const CACHE_TTL = 10 * 60 * 1000;

async function fetchArbeitnowPage(page: number): Promise<NormalizedJob[]> {
  const key = `p:${page}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Arbeitnow API error: ${res.status}`);
  const body = (await res.json()) as { data: ArbeitnowJob[] };
  const normalized: NormalizedJob[] = (body.data ?? []).map((j) => ({
    id: j.slug,
    slug: j.slug,
    title: j.title,
    company: j.company_name,
    location: j.location || "",
    remote: !!j.remote,
    employmentType: (j.job_types?.[0] ?? "").toLowerCase(),
    postedAt: new Date((j.created_at ?? 0) * 1000).toISOString(),
    url: j.url,
    description: j.description ?? "",
    tags: j.tags ?? [],
    provider: "arbeitnow",
  }));
  cache.set(key, { at: Date.now(), data: normalized });
  return normalized;
}

// ───── Adzuna ─────
type AdzunaJob = {
  id: string | number;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  contract_time?: string; // "full_time" | "part_time"
  contract_type?: string; // "permanent" | "contract"
  category?: { label?: string; tag?: string };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
};

function adzunaSlug(country: string, id: string | number): string {
  return `adzuna:${country}:${id}`;
}

async function fetchAdzunaPage(
  country: string,
  page: number,
  opts: { query?: string; location?: string; maxDaysOld?: number; contract?: "full_time" | "part_time" | "contract" },
): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return [];
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "50",
    "content-type": "application/json",
  });
  if (opts.query) params.set("what", opts.query);
  if (opts.location) params.set("where", opts.location);
  if (opts.maxDaysOld) params.set("max_days_old", String(opts.maxDaysOld));
  if (opts.contract === "full_time") params.set("full_time", "1");
  if (opts.contract === "part_time") params.set("part_time", "1");
  if (opts.contract === "contract") params.set("contract", "1");

  const key = `adz:${country}:${page}:${params.toString().replace(`app_id=${appId}&app_key=${appKey}&`, "")}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.error(`[adzuna] ${res.status} ${await res.text().catch(() => "")}`.slice(0, 500));
    return [];
  }
  const body = (await res.json()) as { results?: AdzunaJob[] };
  const normalized: NormalizedJob[] = (body.results ?? []).map((j) => {
    const ct = (j.contract_time ?? "").replace("_", "-");
    const employmentType = ct || (j.contract_type === "contract" ? "contract" : "");
    const tags: string[] = [];
    if (j.category?.label) tags.push(j.category.label);
    if (j.location?.area?.length) tags.push(j.location.area[j.location.area.length - 1]);
    return {
      id: adzunaSlug(country, j.id),
      slug: adzunaSlug(country, j.id),
      title: j.title,
      company: j.company?.display_name ?? "",
      location: j.location?.display_name ?? "",
      remote: /remote/i.test(`${j.title} ${j.description}`),
      employmentType,
      postedAt: j.created ?? new Date().toISOString(),
      url: j.redirect_url,
      description: j.description ?? "",
      tags,
      provider: "adzuna" as const,
    };
  });
  cache.set(key, { at: Date.now(), data: normalized });
  return normalized;
}

// ───── Himalayas ─────
type HimalayasJob = {
  guid: string;
  title: string;
  excerpt?: string;
  description?: string;
  companyName?: string;
  companySlug?: string;
  employmentType?: string;
  locationRestrictions?: string[];
  categories?: string[];
  parentCategories?: string[];
  pubDate?: string;
  applicationLink?: string;
};

async function fetchHimalayasPage(
  page: number,
  opts: { query?: string } = {},
): Promise<NormalizedJob[]> {
  const limit = 50;
  const offset = (page - 1) * limit;
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (opts.query) params.set("q", opts.query);
  const key = `him:${params.toString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const url = `https://himalayas.app/jobs/api?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.error(`[himalayas] ${res.status}`);
      return [];
    }
    const body = (await res.json()) as { jobs?: HimalayasJob[] };
    const normalized: NormalizedJob[] = (body.jobs ?? []).map((j) => {
      const slug = `himalayas:${j.guid}`;
      const tags = [...(j.categories ?? []), ...(j.parentCategories ?? [])].slice(0, 10);
      return {
        id: slug,
        slug,
        title: j.title,
        company: j.companyName ?? "",
        location: (j.locationRestrictions ?? []).join(", ") || "Remote",
        remote: true,
        employmentType: (j.employmentType ?? "").toLowerCase().replace(" ", "-"),
        postedAt: j.pubDate ?? new Date().toISOString(),
        url: j.applicationLink ?? `https://himalayas.app/companies/${j.companySlug ?? ""}`,
        description: j.description ?? j.excerpt ?? "",
        tags,
        provider: "himalayas" as const,
      };
    });
    cache.set(key, { at: Date.now(), data: normalized });
    return normalized;
  } catch (err) {
    console.error("[himalayas] fetch failed", err);
    return [];
  }
}

// ───── RemoteJobs.org ─────
type RemoteJobsJob = {
  id: string;
  title: string;
  url?: string;
  apply_url?: string;
  company?: { name?: string; logo_url?: string; website?: string };
  category?: { name?: string; slug?: string };
  location?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  type?: string;
  description?: string;
  published_at?: string;
  created_at?: string;
};

async function fetchRemoteJobsPage(
  page: number,
  opts: { query?: string } = {},
): Promise<NormalizedJob[]> {
  const limit = 50;
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (opts.query) params.set("q", opts.query);
  const key = `rj:${params.toString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const url = `https://remotejobs.org/api/v1/jobs?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.error(`[remotejobs] ${res.status}`);
      return [];
    }
    const body = (await res.json()) as { data?: RemoteJobsJob[] };
    const normalized: NormalizedJob[] = (body.data ?? []).map((j) => {
      const slug = `remotejobs:${j.id}`;
      const tags = j.category?.name ? [j.category.name] : [];
      return {
        id: slug,
        slug,
        title: j.title,
        company: j.company?.name ?? "",
        location: j.location ?? "Remote",
        remote: /remote/i.test(j.location ?? "Remote"),
        employmentType: (j.type ?? "").toLowerCase().replace(" ", "-"),
        postedAt: j.published_at ?? j.created_at ?? new Date().toISOString(),
        url: j.apply_url ?? j.url ?? "",
        description: j.description ?? "",
        tags,
        provider: "remotejobs" as const,
      };
    });
    cache.set(key, { at: Date.now(), data: normalized });
    return normalized;
  } catch (err) {
    console.error("[remotejobs] fetch failed", err);
    return [];
  }
}



// ───── Remotive ─────
type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

async function fetchRemotivePage(opts: { query?: string } = {}): Promise<NormalizedJob[]> {
  const params = new URLSearchParams();
  if (opts.query) params.set("search", opts.query);
  const key = `rmtv:${params.toString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
  try {
    const url = `https://remotive.com/api/remote-jobs${params.toString() ? `?${params}` : ""}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const body = (await res.json()) as { jobs?: RemotiveJob[] };
    const normalized: NormalizedJob[] = (body.jobs ?? []).slice(0, 100).map((j) => {
      const slug = `remotive:${j.id}`;
      return {
        id: slug,
        slug,
        title: j.title,
        company: j.company_name ?? "",
        location: j.candidate_required_location || "Remote",
        remote: true,
        employmentType: (j.job_type ?? "").toLowerCase().replace(/_/g, "-"),
        postedAt: j.publication_date ?? new Date().toISOString(),
        url: j.url,
        description: j.description ?? "",
        tags: [j.category, ...(j.tags ?? [])].filter(Boolean).slice(0, 10) as string[],
        provider: "remotive" as const,
      };
    });
    cache.set(key, { at: Date.now(), data: normalized });
    return normalized;
  } catch (err) {
    console.error("[remotive] fetch failed", err);
    return [];
  }
}

// ───── RemoteOK ─────
type RemoteOKJob = {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  location?: string;
  tags?: string[];
  description?: string;
  date?: string;
  url?: string;
  apply_url?: string;
};

async function fetchRemoteOK(): Promise<NormalizedJob[]> {
  const key = `rok:all`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { Accept: "application/json", "User-Agent": "TheCareerBoost/1.0" },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as RemoteOKJob[];
    // First element is metadata (legal/info) — skip it.
    const items = Array.isArray(body) ? body.slice(1, 101) : [];
    const normalized: NormalizedJob[] = items.map((j) => {
      const id = j.id ?? j.slug ?? "";
      const slug = `remoteok:${id}`;
      return {
        id: slug,
        slug,
        title: j.position ?? "",
        company: j.company ?? "",
        location: j.location || "Remote",
        remote: true,
        employmentType: "",
        postedAt: j.date ?? new Date().toISOString(),
        url: j.apply_url ?? j.url ?? `https://remoteok.com/remote-jobs/${id}`,
        description: j.description ?? "",
        tags: (j.tags ?? []).slice(0, 10),
        provider: "remoteok" as const,
      };
    });
    cache.set(key, { at: Date.now(), data: normalized });
    return normalized;
  } catch (err) {
    console.error("[remoteok] fetch failed", err);
    return [];
  }
}

// ───── Jobicy ─────
type JobicyJob = {
  id: number | string;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  jobGeo?: string;
  jobLevel?: string;
  jobType?: string[];
  jobIndustry?: string[];
  jobDescription?: string;
  pubDate?: string;
};

async function fetchJobicy(opts: { query?: string } = {}): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({ count: "50" });
  if (opts.query) params.set("tag", opts.query);
  const key = `jcy:${params.toString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
  try {
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { jobs?: JobicyJob[] };
    const normalized: NormalizedJob[] = (body.jobs ?? []).map((j) => {
      const slug = `jobicy:${j.id}`;
      return {
        id: slug,
        slug,
        title: j.jobTitle ?? "",
        company: j.companyName ?? "",
        location: j.jobGeo || "Remote",
        remote: true,
        employmentType: (j.jobType?.[0] ?? "").toLowerCase().replace(/\s+/g, "-"),
        postedAt: j.pubDate ?? new Date().toISOString(),
        url: j.url ?? "",
        description: j.jobDescription ?? "",
        tags: [...(j.jobIndustry ?? []), j.jobLevel ?? ""].filter(Boolean).slice(0, 10) as string[],
        provider: "jobicy" as const,
      };
    });
    cache.set(key, { at: Date.now(), data: normalized });
    return normalized;
  } catch (err) {
    console.error("[jobicy] fetch failed", err);
    return [];
  }
}

// ───── WeWorkRemotely (RSS) ─────
const WWR_CATEGORIES = [
  "remote-programming-jobs",
  "remote-design-jobs",
  "remote-customer-support-jobs",
  "remote-sales-and-marketing-jobs",
  "remote-product-jobs",
];

function pickXmlTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return (cdata ? cdata[1] : raw).trim();
}

async function fetchWWR(): Promise<NormalizedJob[]> {
  const key = "wwr:all";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
  try {
    const all = await Promise.all(
      WWR_CATEGORIES.map(async (cat) => {
        const res = await fetch(`https://weworkremotely.com/categories/${cat}.rss`, {
          headers: { Accept: "application/rss+xml,application/xml,text/xml" },
        });
        if (!res.ok) return [] as NormalizedJob[];
        const xml = await res.text();
        const items = xml.split(/<item>/).slice(1).map((chunk) => "<item>" + chunk.split("</item>")[0] + "</item>");
        return items.map((item, idx): NormalizedJob => {
          const title = pickXmlTag(item, "title");
          const link = pickXmlTag(item, "link");
          const guid = pickXmlTag(item, "guid") || `${cat}:${idx}:${link}`;
          const pubDate = pickXmlTag(item, "pubDate");
          const description = pickXmlTag(item, "description");
          // WWR RSS title format: "Company: Job Title"
          const [companyPart, ...rest] = title.split(":");
          const jobTitle = rest.length ? rest.join(":").trim() : title;
          const slug = `wwr:${guid}`;
          return {
            id: slug,
            slug,
            title: jobTitle,
            company: rest.length ? companyPart.trim() : "",
            location: "Remote",
            remote: true,
            employmentType: "",
            postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            url: link,
            description,
            tags: [cat.replace(/^remote-|-jobs$/g, "").replace(/-/g, " ")],
            provider: "wwr" as const,
          };
        });
      }),
    );
    const normalized = all.flat().slice(0, 200);
    cache.set(key, { at: Date.now(), data: normalized });
    return normalized;
  } catch (err) {
    console.error("[wwr] fetch failed", err);
    return [];
  }
}

// ───── Company boards (Greenhouse / Lever / Ashby) ─────
type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  location?: { name?: string };
  content?: string;
  departments?: { name?: string }[];
};
type LeverJob = {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt?: number;
  categories?: { location?: string; team?: string; commitment?: string };
  description?: string;
  descriptionPlain?: string;
};
type AshbyJob = {
  id: string;
  title: string;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  location?: string;
  employmentType?: string;
  department?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
};

function decodeBasicEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function fetchGreenhouseBoard(token: string, name: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { jobs?: GreenhouseJob[] };
  return (body.jobs ?? []).map((j) => {
    const slug = `company:gh:${token}:${j.id}`;
    const loc = j.location?.name ?? "";
    return {
      id: slug,
      slug,
      title: j.title,
      company: name,
      location: loc,
      remote: /remote/i.test(loc),
      employmentType: "",
      postedAt: j.updated_at ?? new Date().toISOString(),
      url: j.absolute_url,
      description: j.content ? decodeBasicEntities(j.content) : "",
      tags: (j.departments ?? []).map((d) => d.name ?? "").filter(Boolean).slice(0, 5),
      provider: "company" as const,
    };
  });
}

async function fetchLeverBoard(token: string, name: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as LeverJob[];
  return (Array.isArray(body) ? body : []).map((j) => {
    const slug = `company:lv:${token}:${j.id}`;
    const loc = j.categories?.location ?? "";
    return {
      id: slug,
      slug,
      title: j.text,
      company: name,
      location: loc,
      remote: /remote/i.test(loc),
      employmentType: (j.categories?.commitment ?? "").toLowerCase().replace(/\s+/g, "-"),
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
      url: j.hostedUrl,
      description: j.description ?? j.descriptionPlain ?? "",
      tags: [j.categories?.team ?? ""].filter(Boolean) as string[],
      provider: "company" as const,
    };
  });
}

async function fetchAshbyBoard(token: string, name: string): Promise<NormalizedJob[]> {
  // Public posting-api (no auth, separate from the Ashby connector gateway).
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=false`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { jobs?: AshbyJob[] };
  return (body.jobs ?? []).map((j) => {
    const slug = `company:ab:${token}:${j.id}`;
    const loc = j.location ?? "";
    return {
      id: slug,
      slug,
      title: j.title,
      company: name,
      location: loc,
      remote: /remote/i.test(loc),
      employmentType: (j.employmentType ?? "").toLowerCase().replace(/\s+/g, "-"),
      postedAt: j.publishedAt ?? new Date().toISOString(),
      url: j.jobUrl ?? j.applyUrl ?? "",
      description: j.descriptionHtml ?? j.descriptionPlain ?? "",
      tags: [j.department ?? ""].filter(Boolean) as string[],
      provider: "company" as const,
    };
  });
}

const COMPANY_BOARDS_TTL = 30 * 60 * 1000;
async function fetchCompanyBoards(countrySlug: string | undefined): Promise<NormalizedJob[]> {
  const { boardsForCountry } = await import("./job-company-boards");
  const boards = boardsForCountry(countrySlug);
  const key = `cb:${countrySlug ?? "all"}:${boards.map((b) => b.boardToken).join(",")}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < COMPANY_BOARDS_TTL) return hit.data;

  const results = await Promise.allSettled(
    boards.map((b) => {
      if (b.boardType === "greenhouse") return fetchGreenhouseBoard(b.boardToken, b.name);
      if (b.boardType === "lever") return fetchLeverBoard(b.boardToken, b.name);
      return fetchAshbyBoard(b.boardToken, b.name);
    }),
  );
  const merged: NormalizedJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged.push(...r.value);
  }
  cache.set(key, { at: Date.now(), data: merged });
  return merged;
}





const SearchSchema = z.object({
  query: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  remote: z.enum(["any", "remote", "hybrid", "onsite"]).optional(),
  employmentType: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  postedWithinDays: z.number().int().min(0).max(180).optional(),
  page: z.number().int().min(1).max(10).optional(),
  country: z.enum(ADZUNA_COUNTRIES).optional(),
  /** Optional country slug used to scope multi-provider blending to one country page. */
  countrySlug: z.string().max(40).optional(),
  // New multi-value filters (all optional, backward compatible)
  workTypes: z.array(z.enum(["remote", "hybrid", "onsite"])).max(3).optional(),
  employmentTypes: z.array(z.string().max(50)).max(8).optional(),
  categories: z.array(z.string().max(50)).max(20).optional(),
  experienceLevels: z.array(z.string().max(20)).max(8).optional(),
  sort: z.enum(["relevance", "newest", "match", "remote-first", "company-az"]).optional(),
});

export type JobSearchInput = z.infer<typeof SearchSchema>;

function applyFilters(jobs: NormalizedJob[], f: JobSearchInput): NormalizedJob[] {
  const q = f.query?.toLowerCase().trim();
  const loc = f.location?.toLowerCase().trim();
  const empType = f.employmentType?.toLowerCase().trim();
  const industry = f.industry?.toLowerCase().trim();
  const empTypes = (f.employmentTypes ?? []).map((s) => s.toLowerCase());
  const workTypes = f.workTypes ?? [];
  const since = f.postedWithinDays
    ? Date.now() - f.postedWithinDays * 24 * 60 * 60 * 1000
    : null;

  // Pre-compile category + experience patterns to avoid per-job cost.
  const catKeywords: string[][] = [];
  if (f.categories?.length) {
    for (const slug of f.categories) {
      const c = CATEGORY_BY_SLUG[slug];
      if (c) catKeywords.push(c.keywords.map((k) => k.toLowerCase()));
    }
  }
  const expPatterns: RegExp[][] = [];
  if (f.experienceLevels?.length) {
    for (const slug of f.experienceLevels) {
      const e = EXPERIENCE_LEVELS.find((x) => x.slug === slug);
      if (e) expPatterns.push(e.patterns);
    }
  }

  return jobs.filter((j) => {
    if (q) {
      const hay = `${j.title} ${j.company} ${j.tags.join(" ")} ${j.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (loc && !j.location.toLowerCase().includes(loc)) return false;

    // workTypes (multi)
    if (workTypes.length) {
      const blob = `${j.tags.join(" ")} ${j.description}`.toLowerCase();
      const isRemote = j.remote;
      const isHybrid = blob.includes("hybrid");
      const isOnsite = !isRemote && !isHybrid;
      const ok = workTypes.some((w) =>
        w === "remote" ? isRemote :
        w === "hybrid" ? isHybrid :
        isOnsite,
      );
      if (!ok) return false;
    } else {
      // Legacy single-value remote filter still honoured
      if (f.remote === "remote" && !j.remote) return false;
      if (f.remote === "onsite" && j.remote) return false;
      if (f.remote === "hybrid") {
        const tagBlob = j.tags.join(" ").toLowerCase() + " " + j.description.toLowerCase();
        if (!tagBlob.includes("hybrid")) return false;
      }
    }

    // employmentTypes (multi)
    if (empTypes.length) {
      const ok = empTypes.some((e) =>
        j.employmentType.includes(e) || j.tags.some((t) => t.toLowerCase().includes(e)),
      );
      if (!ok) return false;
    } else if (empType) {
      if (!j.employmentType.includes(empType) && !j.tags.some((t) => t.toLowerCase().includes(empType))) return false;
    }

    if (industry && !j.tags.some((t) => t.toLowerCase().includes(industry))) return false;
    if (since && new Date(j.postedAt).getTime() < since) return false;

    // Categories (multi — OR)
    if (catKeywords.length) {
      const hay = `${j.title} ${j.tags.join(" ")}`.toLowerCase();
      const ok = catKeywords.some((kws) => kws.some((k) => hay.includes(k)));
      if (!ok) return false;
    }

    // Experience levels (multi — OR)
    if (expPatterns.length) {
      const ok = expPatterns.some((patterns) => patterns.some((p) => p.test(j.title)));
      if (!ok) return false;
    }

    return true;
  });
}

function applySort(jobs: NormalizedJob[], sort: JobSearchInput["sort"]): NormalizedJob[] {
  if (!sort || sort === "relevance") return jobs;
  const arr = [...jobs];
  if (sort === "newest") {
    arr.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  } else if (sort === "match") {
    // Without a CV in hand on the search server, "match" sort here ranks by
    // recency + remote bias as a sensible proxy. The personalised matcher
    // lives at /jobs/recommendations.
    arr.sort((a, b) => {
      const ra = a.remote ? 1 : 0;
      const rb = b.remote ? 1 : 0;
      if (ra !== rb) return rb - ra;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  } else if (sort === "remote-first") {
    arr.sort((a, b) => Number(b.remote) - Number(a.remote));
  } else if (sort === "company-az") {
    arr.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
  }
  return arr;
}

// Resolve a country profile from the slug (lazy import to avoid a circular module).
async function resolveCountryProfile(slug: string | undefined) {
  if (!slug) return null;
  const { COUNTRY_BY_SLUG } = await import("./job-countries");
  return COUNTRY_BY_SLUG[slug as keyof typeof COUNTRY_BY_SLUG] ?? null;
}

export const searchJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SearchSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    const country = data.country ?? "gb";
    const empt = data.employmentType?.toLowerCase();
    const contract: "full_time" | "part_time" | "contract" | undefined =
      empt === "full-time" ? "full_time"
      : empt === "part-time" ? "part_time"
      : empt === "contract" ? "contract"
      : undefined;

    const profile = await resolveCountryProfile(data.countrySlug);
    const wantsRemote = (data.workTypes ?? []).includes("remote") || profile?.remoteOnly === true;

    // Provider gating:
    //  - Remote (Global): all four providers (legacy behaviour).
    //  - Adzuna-covered country: Adzuna for that country. Add Himalayas/RemoteJobs ONLY if user
    //    wants remote (they're global remote feeds; post-filter trims them to country).
    //    Keep Arbeitnow only on the Germany page (it's a DE-skewed feed otherwise).
    //  - Non-Adzuna country (Nigeria/Ghana/Kenya): query global remote feeds with the country
    //    name as `q` plus Adzuna `gb` with `where=<country>`.
    //  - No country (default search): all four providers (legacy behaviour).
    const useArbeitnow = !profile || profile.slug === "germany" || profile.slug === "remote";
    const useAdzuna = true;
    const useHimalayas = !profile || profile.remoteOnly || !profile.adzunaCovered || wantsRemote;
    const useRemoteJobs = useHimalayas;
    // The free remote bundle (Remotive/RemoteOK/Jobicy/WWR) is global-remote
    // by nature — enable wherever Himalayas/RemoteJobs are enabled.
    const useRemoteBundle = useHimalayas;
    // Company boards are always worth fetching: they're cached 30 min and
    // post-filtered by countrySlug so non-matching boards return nothing.
    const useCompanyBoards = true;

    const globalFeedQuery = profile && !profile.adzunaCovered
      ? (data.query ? `${data.query} ${profile.locationKeyword ?? profile.label}` : (profile.locationKeyword ?? profile.label))
      : data.query;
    const adzunaWhere = profile && !profile.adzunaCovered
      ? (profile.locationKeyword ?? data.location)
      : data.location;

    const empty: NormalizedJob[] = [];
    const [an1, an2, adz1, adz2, him1, rj1, rmtv, rok, jcy, wwr, cb] = await Promise.all([
      useArbeitnow ? fetchArbeitnowPage(page).catch(() => empty) : Promise.resolve(empty),
      useArbeitnow ? fetchArbeitnowPage(page + 1).catch(() => empty) : Promise.resolve(empty),
      useAdzuna ? fetchAdzunaPage(country, page, {
        query: data.query, location: adzunaWhere, maxDaysOld: data.postedWithinDays, contract,
      }).catch(() => empty) : Promise.resolve(empty),
      useAdzuna ? fetchAdzunaPage(country, page + 1, {
        query: data.query, location: adzunaWhere, maxDaysOld: data.postedWithinDays, contract,
      }).catch(() => empty) : Promise.resolve(empty),
      useHimalayas ? fetchHimalayasPage(page, { query: globalFeedQuery }).catch(() => empty) : Promise.resolve(empty),
      useRemoteJobs ? fetchRemoteJobsPage(page, { query: globalFeedQuery }).catch(() => empty) : Promise.resolve(empty),
      useRemoteBundle ? fetchRemotivePage({ query: globalFeedQuery }).catch(() => empty) : Promise.resolve(empty),
      useRemoteBundle ? fetchRemoteOK().catch(() => empty) : Promise.resolve(empty),
      useRemoteBundle ? fetchJobicy({ query: globalFeedQuery }).catch(() => empty) : Promise.resolve(empty),
      useRemoteBundle ? fetchWWR().catch(() => empty) : Promise.resolve(empty),
      useCompanyBoards ? fetchCompanyBoards(data.countrySlug).catch(() => empty) : Promise.resolve(empty),
    ]);

    // Country allow-list: drop non-Adzuna jobs whose location/description doesn't match this country.
    const aliases = (profile?.cityAliases ?? []).map((s) => s.toLowerCase());
    const inCountry = (j: NormalizedJob): boolean => {
      if (!profile || profile.remoteOnly) return true;
      // Adzuna results are already country-scoped; trust them.
      if (j.provider === "adzuna") return true;
      // Company boards already scoped to country via boardsForCountry(); the
      // "global" remote-first set is always allowed through.
      if (j.provider === "company") return true;
      if (!aliases.length) return true;
      const hay = `${j.location} ${j.description.slice(0, 400)} ${j.tags.join(" ")}`.toLowerCase();
      return aliases.some((a) => hay.includes(a));
    };

    // Round-robin interleave so the 50-result slice keeps a mix from every provider
    const buckets = [
      [...an1, ...an2].filter(inCountry),
      [...adz1, ...adz2].filter(inCountry),
      [...him1].filter(inCountry),
      [...rj1].filter(inCountry),
      rmtv.filter(inCountry),
      rok.filter(inCountry),
      jcy.filter(inCountry),
      wwr.filter(inCountry),
      cb.filter(inCountry),
    ];
    const seen = new Set<string>();
    const merged: NormalizedJob[] = [];
    const maxLen = Math.max(0, ...buckets.map((b) => b.length));
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        const j = bucket[i];
        if (!j) continue;
        const k = `${j.provider}:${j.id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        merged.push(j);
      }
    }
    const filtered = applyFilters(merged, data);
    const sorted = applySort(filtered, data.sort);
    const pageSize = 50;
    const hasMore =
      sorted.length > pageSize ||
      an1.length >= 50 || adz1.length >= 50 || him1.length >= 50 || rj1.length >= 50;
    return { jobs: sorted.slice(0, pageSize), total: sorted.length, page, hasMore };
  });



// Live job-count strip — Adzuna's count endpoint, cached for 1h per filter.
const statsCache = new Map<string, { at: number; n: number }>();
const STATS_TTL = 60 * 60 * 1000;

async function adzunaCount(country: string, params: Record<string, string>): Promise<number> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return 0;
  const key = `cnt:${country}:${new URLSearchParams(params).toString()}`;
  const hit = statsCache.get(key);
  if (hit && Date.now() - hit.at < STATS_TTL) return hit.n;
  const search = new URLSearchParams({ app_id: appId, app_key: appKey, results_per_page: "0", ...params });
  try {
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${search.toString()}`);
    if (!res.ok) return 0;
    const body = (await res.json()) as { count?: number };
    const n = body.count ?? 0;
    statsCache.set(key, { at: Date.now(), n });
    return n;
  } catch {
    return 0;
  }
}

export const getJobStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [remote, uk, us, ca, de, cs] = await Promise.all([
      adzunaCount("gb", { what: "remote" }),
      adzunaCount("gb", {}),
      adzunaCount("us", {}),
      adzunaCount("ca", {}),
      adzunaCount("de", {}),
      adzunaCount("gb", { what: "customer success" }),
    ]);
    return { remote, uk, us, canada: ca, germany: de, customerSuccess: cs };
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(300) }).parse(input))
  .handler(async ({ data }) => {
    if (data.slug.startsWith("adzuna:")) {
      const [, country] = data.slug.split(":");
      for (let p = 1; p <= 3; p++) {
        const jobs = await fetchAdzunaPage(country, p, {}).catch(() => []);
        const hit = jobs.find((j) => j.slug === data.slug);
        if (hit) return hit;
      }
      throw new Error("Job not found");
    }
    if (data.slug.startsWith("himalayas:")) {
      for (let p = 1; p <= 4; p++) {
        const jobs = await fetchHimalayasPage(p).catch(() => []);
        const hit = jobs.find((j) => j.slug === data.slug);
        if (hit) return hit;
      }
      throw new Error("Job not found");
    }
    if (data.slug.startsWith("remotejobs:")) {
      for (let p = 1; p <= 4; p++) {
        const jobs = await fetchRemoteJobsPage(p).catch(() => []);
        const hit = jobs.find((j) => j.slug === data.slug);
        if (hit) return hit;
      }
      throw new Error("Job not found");
    }
    for (let p = 1; p <= 3; p++) {
      const jobs = await fetchArbeitnowPage(p);
      const hit = jobs.find((j) => j.slug === data.slug);
      if (hit) return hit;
    }
    throw new Error("Job not found");
  });

// ────────────────────────────────────────────────────────────────────────────
// Saved jobs
// ────────────────────────────────────────────────────────────────────────────

const JobInputSchema = z.object({
  provider: z.string().default("arbeitnow"),
  externalId: z.string().min(1).max(300),
  title: z.string().min(1).max(500),
  company: z.string().max(300).optional(),
  location: z.string().max(300).optional(),
  employmentType: z.string().max(100).optional(),
  remote: z.boolean().optional(),
  postedAt: z.string().optional(),
  url: z.string().max(1000).optional(),
  description: z.string().max(50000).optional(),
  tags: z.array(z.string()).max(40).optional(),
});

export const saveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => JobInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("saved_jobs")
      .upsert(
        {
          user_id: userId,
          provider: data.provider,
          external_id: data.externalId,
          title: data.title,
          company: data.company ?? null,
          location: data.location ?? null,
          employment_type: data.employmentType ?? null,
          remote: data.remote ?? false,
          posted_at: data.postedAt ?? null,
          url: data.url ?? null,
          description: data.description ?? null,
          tags: data.tags ?? [],
        },
        { onConflict: "user_id,provider,external_id" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const unsaveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ provider: z.string().default("arbeitnow"), externalId: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", data.provider)
      .eq("external_id", data.externalId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), favorited: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_jobs")
      .update({ favorited: data.favorited })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSavedJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ────────────────────────────────────────────────────────────────────────────
// Applications tracker
// ────────────────────────────────────────────────────────────────────────────

const STATUSES = ["saved", "applied", "interview", "assessment", "offer", "rejected"] as const;
export const APP_STATUSES = STATUSES;

const CreateAppSchema = z.object({
  savedJobId: z.string().uuid().nullable().optional(),
  provider: z.string().default("arbeitnow"),
  externalId: z.string().optional(),
  title: z.string().min(1).max(500),
  company: z.string().max(300).optional(),
  url: z.string().max(1000).optional(),
  status: z.enum(STATUSES).default("saved"),
  notes: z.string().max(5000).optional(),
});

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateAppSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,
        saved_job_id: data.savedJobId ?? null,
        provider: data.provider,
        external_id: data.externalId ?? null,
        title: data.title,
        company: data.company ?? null,
        url: data.url ?? null,
        status: data.status,
        notes: data.notes ?? null,
        applied_at: data.status === "applied" ? new Date().toISOString() : null,
      })
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch = {
      status: data.status,
      last_status_at: new Date().toISOString(),
      ...(data.status === "applied" ? { applied_at: new Date().toISOString() } : {}),
    };
    const { error } = await context.supabase
      .from("job_applications")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("job_applications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", context.userId)
      .order("last_status_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ────────────────────────────────────────────────────────────────────────────
// Match analysis — wraps the existing analyzer
// ────────────────────────────────────────────────────────────────────────────

const MatchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).max(8),
  weaknesses: z.array(z.string()).max(8),
  missingKeywords: z.array(z.string()).max(20),
});

const AnalyzeJobSchema = z.object({
  resumeText: z.string().min(50).max(50000),
  job: JobInputSchema,
});

export const analyzeJobMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeJobSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Plan + admin gating (mirrors analyzeResume)
    const { data: rolesRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("suspended", false)
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .maybeSingle();
    const isAdmin = !!rolesRow;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_tier, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();

    if (!isAdmin) {
      const proActive = profile?.plan === "pro" && profile?.pro_expires_at &&
        new Date(profile.pro_expires_at).getTime() > Date.now();
      const effectiveTier = proActive ? (profile?.plan_tier as string ?? "free") : "free";
      const { getMonthlyLimit } = await import("./plans");
      const limit = getMonthlyLimit(effectiveTier as never);
      if (limit !== null) {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const { count } = await supabaseAdmin
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", monthStart.toISOString());
        if ((count ?? 0) >= limit) {
          throw new Error(
            effectiveTier === "free"
              ? `Free plan limit reached: ${limit} CV analyses per month. Upgrade to Pro to continue.`
              : `Monthly limit reached (${limit} analyses). Upgrade for more capacity.`,
          );
        }
      }
    }

    // Strip basic HTML from job description for cleaner prompts
    const jobText = (data.job.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const jobDescription =
      `Title: ${data.job.title}\nCompany: ${data.job.company ?? ""}\nLocation: ${data.job.location ?? ""}\n\n${jobText}`;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const system = `You are an elite ATS-style resume/job matcher. Given a resume and a job description, return JSON:
- matchScore: 0-100 numeric fit score
- summary: 2 short sentences explaining the score
- strengths: 3-6 concrete bullet phrases
- weaknesses: 3-6 concrete gaps
- missingKeywords: 5-15 ATS-relevant keywords missing from the resume
Never invent employers, degrees, or dates. Confident, specific, ATS-friendly tone.`;

    const prompt = `RESUME:\n"""\n${data.resumeText}\n"""\n\nJOB DESCRIPTION:\n"""\n${jobDescription}\n"""`;

    let result: z.infer<typeof MatchSchema> | null = null;
    for (const model of ["google/gemini-2.5-flash", "google/gemini-2.5-pro"]) {
      try {
        const gen = await generateText({
          model: gateway(model),
          system,
          prompt,
          experimental_output: Output.object({ schema: MatchSchema }),
        });
        result = gen.experimental_output as z.infer<typeof MatchSchema>;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429")) throw new Error("Rate limit reached. Try again in a moment.");
        if (msg.includes("402")) throw new Error("AI credits exhausted.");
        if (model === "google/gemini-2.5-pro") throw new Error(`Match analysis failed: ${msg}`);
      }
    }
    if (!result) throw new Error("Match analysis failed.");

    // Persist to analyses (so it counts toward usage + shows in history)
    const { data: analysis } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: userId,
        resume_filename: `Job match: ${data.job.title}`.slice(0, 250),
        resume_text: data.resumeText,
        job_description: jobDescription,
        match_score: result.matchScore,
        summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        missing_keywords: result.missingKeywords,
        optimized_resume: "",
        cover_letter: "",
      })
      .select("id")
      .single();

    // Link to job_matches for recommendations / dashboard widgets
    await supabase.from("job_matches").insert({
      user_id: userId,
      analysis_id: analysis?.id ?? null,
      provider: data.job.provider,
      external_id: data.job.externalId,
      title: data.job.title,
      company: data.job.company ?? null,
      match_score: result.matchScore,
    });

    return { ...result, analysisId: analysis?.id ?? null };
  });

// ────────────────────────────────────────────────────────────────────────────
// Recommendations
// ────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "the","and","for","with","you","are","our","your","that","this","from","have","will","not",
  "but","they","their","has","was","were","been","into","more","than","over","other","such","very",
  "all","any","can","may","one","two","new","work","team","role","job","experience","year","years",
  "skills","skill","good","strong","ability","including","using","use","used","across","within",
  "etc","day","days","week","weeks","month","months","like","also","make","made","help","working",
]);

function topKeywords(text: string, limit = 8): string[] {
  const freq = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9+#.]+/)) {
    const w = raw.trim();
    if (w.length < 3 || w.length > 30) continue;
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

export const recommendJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: latest } = await supabase
      .from("analyses")
      .select("resume_text, missing_keywords, strengths")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", userId)
      .maybeSingle();

    if (!latest?.resume_text) {
      return { jobs: [] as NormalizedJob[], keywords: [] as string[], hasResume: false };
    }

    const fromResume = topKeywords(latest.resume_text, 8);
    const fromMissing = (latest.missing_keywords as string[] | null) ?? [];
    const keywords = Array.from(new Set([...fromMissing.slice(0, 4), ...fromResume])).slice(0, 8);
    const adzQuery = keywords.slice(0, 3).join(" ");
    const countryGuess = (profile?.country_code ?? "").toLowerCase();
    const country = (ADZUNA_COUNTRIES as readonly string[]).includes(countryGuess) ? countryGuess : "gb";

    // Pull a couple pages and score
    const all = [
      ...(await fetchArbeitnowPage(1).catch(() => [])),
      ...(await fetchArbeitnowPage(2).catch(() => [])),
      ...(await fetchAdzunaPage(country, 1, { query: adzQuery }).catch(() => [])),
      ...(await fetchAdzunaPage(country, 2, { query: adzQuery }).catch(() => [])),
      ...(await fetchHimalayasPage(1, { query: adzQuery }).catch(() => [])),
      ...(await fetchRemoteJobsPage(1, { query: adzQuery }).catch(() => [])),
    ];
    const scored = all.map((j) => {
      const hay = `${j.title} ${j.tags.join(" ")} ${j.description}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) if (hay.includes(kw)) score += 1;
      const ageDays = (Date.now() - new Date(j.postedAt).getTime()) / (24 * 60 * 60 * 1000);
      const recency = Math.max(0, 1 - ageDays / 30);
      return { job: j, score: score + recency };
    });
    scored.sort((a, b) => b.score - a.score);
    const jobs = scored.filter((s) => s.score > 0).slice(0, 12).map((s) => s.job);
    return { jobs, keywords, hasResume: true };
  });

// ────────────────────────────────────────────────────────────────────────────
// Dashboard widgets
// ────────────────────────────────────────────────────────────────────────────

export const getJobsDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [savedRes, appsRes, matchesRes] = await Promise.all([
      supabase.from("saved_jobs").select("id, title, company, url, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("job_applications").select("status").eq("user_id", userId),
      supabase.from("job_matches").select("title, company, match_score, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    const counts: Record<string, number> = { saved: 0, applied: 0, interview: 0, assessment: 0, offer: 0, rejected: 0 };
    for (const a of appsRes.data ?? []) counts[(a as { status: string }).status] = (counts[(a as { status: string }).status] ?? 0) + 1;
    return {
      savedCount: (savedRes.data ?? []).length,
      recentSaved: savedRes.data ?? [],
      recentMatches: matchesRes.data ?? [],
      applicationCounts: counts,
    };
  });
