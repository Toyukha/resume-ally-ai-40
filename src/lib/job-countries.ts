// Country catalog for Jobs marketplace.
// `adzuna` = best Adzuna country code to query for jobs in this country.
// For countries not covered by Adzuna (Nigeria, Ghana, Kenya), we use `gb` as a
// base and additionally filter by the country name in `location` post-fetch.

import type { AdzunaCountry } from "./jobs.functions";

export type CountrySlug =
  | "us" | "uk" | "canada" | "germany" | "netherlands" | "france"
  | "australia" | "nigeria" | "ghana" | "kenya" | "south-africa" | "remote";

export type CountryEntry = {
  slug: CountrySlug;
  label: string;
  shortLabel: string;
  flag: string;
  adzuna: AdzunaCountry;
  /** Extra location keyword to filter by post-fetch (for non-Adzuna countries). */
  locationKeyword?: string;
  /** Force remote filter on. */
  remoteOnly?: boolean;
  /** True when Adzuna actually covers this country (false = `gb` fallback). */
  adzunaCovered?: boolean;
  /** Location aliases (cities/regions) used to allow-list non-Adzuna jobs into this country. */
  cityAliases?: string[];
};

export const COUNTRIES: CountryEntry[] = [
  { slug: "us", label: "United States", shortLabel: "USA", flag: "🇺🇸", adzuna: "us", adzunaCovered: true,
    cityAliases: ["united states", "usa", "u.s.", "new york", "san francisco", "los angeles", "seattle", "austin", "boston", "chicago", "denver", "atlanta", "miami", "remote us"] },
  { slug: "uk", label: "United Kingdom", shortLabel: "UK", flag: "🇬🇧", adzuna: "gb", adzunaCovered: true,
    cityAliases: ["united kingdom", "uk", "england", "britain", "london", "manchester", "edinburgh", "glasgow", "bristol", "leeds", "birmingham"] },
  { slug: "canada", label: "Canada", shortLabel: "Canada", flag: "🇨🇦", adzuna: "ca", adzunaCovered: true,
    cityAliases: ["canada", "toronto", "vancouver", "montreal", "ottawa", "calgary", "edmonton", "ontario", "quebec", "alberta", "british columbia"] },
  { slug: "germany", label: "Germany", shortLabel: "Germany", flag: "🇩🇪", adzuna: "de", adzunaCovered: true,
    cityAliases: ["germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "frankfurt", "köln", "cologne", "stuttgart", "düsseldorf"] },
  { slug: "netherlands", label: "Netherlands", shortLabel: "Netherlands", flag: "🇳🇱", adzuna: "nl", adzunaCovered: true,
    cityAliases: ["netherlands", "amsterdam", "rotterdam", "utrecht", "the hague", "eindhoven"] },
  { slug: "france", label: "France", shortLabel: "France", flag: "🇫🇷", adzuna: "fr", adzunaCovered: true,
    cityAliases: ["france", "paris", "lyon", "marseille", "toulouse", "bordeaux", "nice"] },
  { slug: "australia", label: "Australia", shortLabel: "Australia", flag: "🇦🇺", adzuna: "au", adzunaCovered: true,
    cityAliases: ["australia", "sydney", "melbourne", "brisbane", "perth", "adelaide"] },
  { slug: "south-africa", label: "South Africa", shortLabel: "South Africa", flag: "🇿🇦", adzuna: "za", adzunaCovered: true,
    cityAliases: ["south africa", "johannesburg", "cape town", "durban", "pretoria"] },
  // Adzuna doesn't cover these — fall back to global feeds with a location filter
  { slug: "nigeria", label: "Nigeria", shortLabel: "Nigeria", flag: "🇳🇬", adzuna: "gb", locationKeyword: "nigeria", adzunaCovered: false,
    cityAliases: ["nigeria", "lagos", "abuja", "ibadan", "port harcourt", "kano"] },
  { slug: "ghana", label: "Ghana", shortLabel: "Ghana", flag: "🇬🇭", adzuna: "gb", locationKeyword: "ghana", adzunaCovered: false,
    cityAliases: ["ghana", "accra", "kumasi"] },
  { slug: "kenya", label: "Kenya", shortLabel: "Kenya", flag: "🇰🇪", adzuna: "gb", locationKeyword: "kenya", adzunaCovered: false,
    cityAliases: ["kenya", "nairobi", "mombasa"] },
  { slug: "remote", label: "Remote (Global)", shortLabel: "Remote", flag: "🌍", adzuna: "gb", remoteOnly: true },
];


export const COUNTRY_BY_SLUG: Record<CountrySlug, CountryEntry> = Object.fromEntries(
  COUNTRIES.map((c) => [c.slug, c]),
) as Record<CountrySlug, CountryEntry>;

export function flagForLocation(location: string | null | undefined): string {
  if (!location) return "🌍";
  const l = location.toLowerCase();
  for (const c of COUNTRIES) {
    if (c.locationKeyword && l.includes(c.locationKeyword)) return c.flag;
    if (l.includes(c.label.toLowerCase())) return c.flag;
    if (c.shortLabel && l.includes(c.shortLabel.toLowerCase())) return c.flag;
  }
  // Common abbreviations
  if (/\busa?\b|united states/i.test(location)) return "🇺🇸";
  if (/\buk\b|united kingdom|england|britain/i.test(location)) return "🇬🇧";
  return "🌍";
}
