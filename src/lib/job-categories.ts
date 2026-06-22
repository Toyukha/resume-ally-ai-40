// Job category catalog. Each category maps to a list of keyword patterns
// used to match against job title + tags + description.

export type CategoryEntry = {
  slug: string;
  label: string;
  emoji: string;
  /** Lowercase keyword fragments — match if any appears in title/tags. */
  keywords: string[];
};

export const CATEGORIES: CategoryEntry[] = [
  { slug: "customer-success",     label: "Customer Success",     emoji: "💼", keywords: ["customer success", "csm", "client success"] },
  { slug: "customer-support",     label: "Customer Support",     emoji: "🎧", keywords: ["customer support", "support specialist", "help desk", "technical support"] },
  { slug: "sales",                label: "Sales",                emoji: "🎯", keywords: ["sales", "account executive", " bdr", " sdr", "business dev rep"] },
  { slug: "marketing",            label: "Marketing",            emoji: "📈", keywords: ["marketing", "growth", "seo", "content marketing", "brand"] },
  { slug: "product-management",   label: "Product Management",   emoji: "🧭", keywords: ["product manager", "product owner", "pm"] },
  { slug: "project-management",   label: "Project Management",   emoji: "🗂️", keywords: ["project manager", "program manager", "scrum master", "delivery manager"] },
  { slug: "data-analysis",        label: "Data Analysis",        emoji: "📊", keywords: ["data analyst", "analytics", "business analyst", "bi analyst"] },
  { slug: "data-science",         label: "Data Science",         emoji: "🧠", keywords: ["data scientist", "machine learning", "ml engineer", "ai engineer"] },
  { slug: "software-engineering", label: "Software Engineering", emoji: "💻", keywords: ["software engineer", "developer", "backend", "frontend", "fullstack", "full stack", "engineer", "swe"] },
  { slug: "devops",               label: "DevOps",               emoji: "⚙️", keywords: ["devops", "sre", "site reliability", "platform engineer", "infrastructure"] },
  { slug: "ui-ux",                label: "UI/UX Design",         emoji: "🎨", keywords: ["ux", "ui designer", "product design", "interaction design", "visual design"] },
  { slug: "hr",                   label: "Human Resources",      emoji: "👥", keywords: ["human resources", "people operations", "recruiter", "talent acquisition", "hr "] },
  { slug: "finance",              label: "Finance",              emoji: "💰", keywords: ["finance", "financial analyst", "fp&a", "treasury"] },
  { slug: "accounting",           label: "Accounting",           emoji: "📒", keywords: ["accountant", "accounting", "bookkeeper", "controller"] },
  { slug: "operations",           label: "Operations",           emoji: "🔧", keywords: ["operations", "ops manager", "supply chain"] },
  { slug: "business-development", label: "Business Development", emoji: "🤝", keywords: ["business development", "partnerships"] },
  { slug: "healthcare",           label: "Healthcare",           emoji: "🏥", keywords: ["nurse", "healthcare", "clinical", "physician", "medical"] },
  { slug: "education",            label: "Education",            emoji: "🎓", keywords: ["teacher", "education", "instructor", "tutor", "professor"] },
  { slug: "legal",                label: "Legal",                emoji: "⚖️", keywords: ["legal", "lawyer", "paralegal", "attorney", "counsel"] },
];

export const CATEGORY_BY_SLUG: Record<string, CategoryEntry> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export function categoryMatches(category: CategoryEntry, job: { title: string; tags: string[]; description?: string }): boolean {
  const hay = `${job.title} ${job.tags.join(" ")}`.toLowerCase();
  return category.keywords.some((k) => hay.includes(k));
}

export type ExperienceLevel = {
  slug: string;
  label: string;
  patterns: RegExp[];
};

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  { slug: "entry",     label: "Entry Level", patterns: [/\b(entry|graduate|trainee|intern(?!al))\b/i] },
  { slug: "junior",    label: "Junior",      patterns: [/\b(junior|jr)\b/i] },
  { slug: "mid",       label: "Mid-Level",   patterns: [/\b(mid|mid-level|associate|intermediate)\b/i] },
  { slug: "senior",    label: "Senior",      patterns: [/\b(senior|sr)\b/i] },
  { slug: "lead",      label: "Lead",        patterns: [/\b(lead|principal|staff)\b/i] },
  { slug: "executive", label: "Executive",   patterns: [/\b(director|head of|chief|vp|vice president|cto|ceo|cfo|coo)\b/i] },
];

export function experienceMatches(level: ExperienceLevel, title: string): boolean {
  return level.patterns.some((p) => p.test(title));
}

export const EMPLOYMENT_TYPES = [
  { slug: "full-time",  label: "Full-Time" },
  { slug: "part-time",  label: "Part-Time" },
  { slug: "contract",   label: "Contract" },
  { slug: "internship", label: "Internship" },
  { slug: "freelance",  label: "Freelance" },
] as const;

export const SORT_OPTIONS = [
  { value: "relevance",   label: "Most Relevant" },
  { value: "newest",      label: "Newest Jobs" },
  { value: "match",       label: "Highest Match Score" },
  { value: "remote-first", label: "Remote First" },
  { value: "company-az",  label: "Company (A–Z)" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
