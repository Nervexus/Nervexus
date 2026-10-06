import type { CategoryKey } from "./types";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  short: string;
  href: string;
  tagline: string;
  color: string;
  defaultItems: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "self-improvement",
    label: "Self Improvement",
    short: "Mindset",
    href: "/self-improvement",
    tagline: "Discipline, focus & growth",
    color: "var(--cat-self)",
    defaultItems: [
      "10 min meditation",
      "Read 15 pages",
      "Journal / reflect",
      "No social media before noon",
      "Plan tomorrow",
    ],
  },
  {
    key: "health",
    label: "Health Improvements",
    short: "Health",
    href: "/health",
    tagline: "Body, energy & recovery",
    color: "var(--cat-health)",
    defaultItems: [
      "Workout session",
      "8 glasses of water",
      "7+ hours sleep",
      "Protein target hit",
      "10k steps",
    ],
  },
  {
    key: "social-media",
    label: "Social Media Improvement",
    short: "Social",
    href: "/social-media",
    tagline: "Presence, reach & income",
    color: "var(--cat-social)",
    defaultItems: [
      "Post content",
      "Reply to comments",
      "Engage 20 min",
      "Review analytics",
      "Outreach / collab DM",
    ],
  },
  {
    key: "looks",
    label: "Looks Improvements",
    short: "Looks",
    href: "/looks",
    tagline: "Grooming, style & skin",
    color: "var(--cat-looks)",
    defaultItems: [
      "Skincare AM/PM",
      "Posture check",
      "Haircare routine",
      "Outfit prep",
      "Dental care",
    ],
  },
];

export function getCategory(key: CategoryKey): CategoryMeta {
  const found = CATEGORIES.find((c) => c.key === key);
  if (!found) throw new Error(`Unknown category: ${key}`);
  return found;
}
