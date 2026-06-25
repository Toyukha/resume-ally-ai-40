// Curated list of public company job boards. All endpoints are free and
// require no auth. Failures of any single board are swallowed by the
// aggregator in jobs.functions.ts, so best-guess tokens are safe to include.

export type BoardType = "greenhouse" | "lever" | "ashby";

export type CompanyBoard = {
  name: string;
  /** Lowercase country slug (matches COUNTRIES.slug). "global" = remote-first / multi-country. */
  country: string;
  boardType: BoardType;
  /** Board token used in the provider's public API URL. */
  boardToken: string;
};

export const COMPANY_BOARDS: CompanyBoard[] = [
  // ── African tech (fills the Nigeria/Ghana/Kenya gap) ──
  { name: "Flutterwave",   country: "nigeria", boardType: "greenhouse", boardToken: "flutterwave" },
  { name: "Paystack",      country: "nigeria", boardType: "lever",      boardToken: "paystack" },
  { name: "Andela",        country: "nigeria", boardType: "lever",      boardToken: "andela" },
  { name: "Kuda",          country: "nigeria", boardType: "lever",      boardToken: "kuda" },
  { name: "Moniepoint",    country: "nigeria", boardType: "lever",      boardToken: "moniepoint" },
  { name: "Interswitch",   country: "nigeria", boardType: "greenhouse", boardToken: "interswitchgroup" },
  { name: "Moove",         country: "nigeria", boardType: "greenhouse", boardToken: "moove" },
  { name: "Carry1st",      country: "nigeria", boardType: "ashby",      boardToken: "carry1st" },
  { name: "Yellow Card",   country: "nigeria", boardType: "ashby",      boardToken: "yellowcard" },
  { name: "Chipper Cash",  country: "nigeria", boardType: "greenhouse", boardToken: "chippercash" },
  { name: "mPharma",       country: "ghana",   boardType: "greenhouse", boardToken: "mpharma" },
  { name: "Jumia",         country: "kenya",   boardType: "greenhouse", boardToken: "jumia" },

  // ── Global remote-first ──
  { name: "GitLab",        country: "global", boardType: "greenhouse", boardToken: "gitlab" },
  { name: "Automattic",    country: "global", boardType: "lever",      boardToken: "automattic" },
  { name: "Zapier",        country: "global", boardType: "greenhouse", boardToken: "zapier" },
  { name: "Buffer",        country: "global", boardType: "ashby",      boardToken: "buffer" },
  { name: "Doist",         country: "global", boardType: "greenhouse", boardToken: "doist" },
  { name: "Toptal",        country: "global", boardType: "lever",      boardToken: "toptal" },
  { name: "Deel",          country: "global", boardType: "ashby",      boardToken: "deel" },
  { name: "Remote",        country: "global", boardType: "ashby",      boardToken: "remotecom" },
];

export function boardsForCountry(countrySlug: string | undefined): CompanyBoard[] {
  if (!countrySlug) return COMPANY_BOARDS;
  if (countrySlug === "remote") return COMPANY_BOARDS.filter((b) => b.country === "global");
  return COMPANY_BOARDS.filter((b) => b.country === countrySlug || b.country === "global");
}
