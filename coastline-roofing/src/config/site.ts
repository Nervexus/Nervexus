// ---------------------------------------------------------------------------
// SITE CONFIG — everything business-specific lives here.
// Swap this file's contents for a real client and the whole site re-brands:
// name, contact details, areas, services, reviews, gallery, and colours.
// ---------------------------------------------------------------------------

export type Service = {
  title: string;
  description: string;
  icon: ServiceIcon;
};

export type ServiceIcon =
  | "repair"
  | "newRoof"
  | "flatRoof"
  | "guttering"
  | "chimney"
  | "emergency";

export type Review = {
  name: string;
  area: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
};

export type GalleryItem = {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  caption: string;
};

export const siteConfig = {
  // --- Brand -----------------------------------------------------------
  name: "Coastline Roofing",
  shortName: "Coastline",
  tagline: "Southampton's Trusted Roofing Specialists",
  heroHeadline: "Roofing Southampton Can Rely On",
  heroSubheadline:
    "Storm damage, leaks, full re-roofs or a new set of gutters — our local, fully insured team gets it done right the first time.",
  foundedYear: 2007,
  yearsExperience: new Date().getFullYear() - 2007,

  // --- Location ----------------------------------------------------------
  town: "Southampton",
  county: "Hampshire",
  address: {
    line1: "Unit 4, Harbour Trade Park",
    line2: "Southampton",
    postcode: "SO14 5XX",
  },

  // --- Contact (placeholder numbers — safe to leave as-is for a demo) ----
  // The mobile/WhatsApp number uses Ofcom's official "fiction" range
  // (07700 900xxx) which is reserved for exactly this purpose and will
  // never reach a real person. The landline is a made-up Southampton
  // (023 8xxx) number — swap both for the real client's numbers.
  phone: {
    display: "023 8000 1234",
    href: "tel:+442380001234",
  },
  whatsapp: {
    display: "07700 900123",
    number: "447700900123", // international format, no leading +, no spaces
  },
  email: "info@coastlineroofing.co.uk",

  // --- Social proof --------------------------------------------------
  trustPoints: [
    { label: `${new Date().getFullYear() - 2007}+ Years Experience`, icon: "years" as const },
    { label: "Fully Insured & Accredited", icon: "shield" as const },
    { label: "Free, No-Obligation Quotes", icon: "quote" as const },
    { label: "10-Year Workmanship Guarantee", icon: "guarantee" as const },
  ],

  // --- Services ------------------------------------------------------
  services: [
    {
      title: "Roof Repairs",
      description:
        "Leaks, slipped slates, storm damage — diagnosed and fixed fast, with photos so you know exactly what was wrong.",
      icon: "repair",
    },
    {
      title: "New Roofs",
      description:
        "Full re-roofs using quality tile, slate or shingle, with a clear written quote and a tidy site from start to finish.",
      icon: "newRoof",
    },
    {
      title: "Flat Roofs",
      description:
        "GRP fibreglass and felt flat roofing for extensions, garages and dormers, built to shed water and last.",
      icon: "flatRoof",
    },
    {
      title: "Guttering & Fascias",
      description:
        "New gutters, fascias and soffits fitted or repaired — stop overflow and damp before it reaches your walls.",
      icon: "guttering",
    },
    {
      title: "Chimney Work",
      description:
        "Repointing, flashing and chimney removal or capping, carried out safely with the right access equipment.",
      icon: "chimney",
    },
    {
      title: "Emergency Repairs",
      description:
        "Storm damage or a sudden leak? We offer rapid callouts across our coverage area to make your roof safe again.",
      icon: "emergency",
    },
  ] satisfies Service[],

  // --- Areas covered ---------------------------------------------------
  areasCovered: [
    "Southampton",
    "Totton",
    "Hythe",
    "Fawley",
    "New Forest",
    "Eastleigh",
  ],

  // --- Reviews (clearly marked as examples in the UI) -------------------
  reviews: [
    {
      name: "Sarah M.",
      area: "Southampton",
      rating: 5,
      text: "Quick to respond, turned up when they said they would, and left the garden spotless afterwards. Couldn't fault them.",
    },
    {
      name: "David P.",
      area: "Totton",
      rating: 5,
      text: "Had a leak during a storm and they came out the next morning. Sorted a long-term problem that two other roofers had missed.",
    },
    {
      name: "Rachel H.",
      area: "Eastleigh",
      rating: 5,
      text: "Full re-roof on our 1930s semi. Great communication throughout and the price matched the quote exactly.",
    },
    {
      name: "Mark T.",
      area: "Hythe",
      rating: 4,
      text: "Solid work on our flat roof extension — no more leaks after two winters. Would use again.",
    },
  ] satisfies Review[],

  // --- Before / after gallery -------------------------------------------
  // Stock photography used for this demo — swap for the client's own job
  // photos. See README for full photo credits.
  gallery: [
    {
      before: {
        src: "/images/gallery-before-1.jpg",
        alt: "Close-up of aged, moss-covered roof shingles before replacement",
      },
      after: {
        src: "/images/gallery-after-1.jpg",
        alt: "Aerial view of a smart, uniform new shingle roof after replacement",
      },
      caption: "Full re-roof — tile & shingle replacement",
    },
    {
      before: {
        src: "/images/gallery-before-2.jpg",
        alt: "Roofer stripping old, damaged shingles during a repair",
      },
      after: {
        src: "/images/gallery-after-2.jpg",
        alt: "Neat, intact shingle roof after repair work is complete",
      },
      caption: "Roof repair & renewal",
    },
    {
      before: {
        src: "/images/gallery-before-3.jpg",
        alt: "Grimy, moss-clogged old guttering before replacement",
      },
      after: {
        src: "/images/gallery-after-3.jpg",
        alt: "Clean new guttering and downpipe after replacement",
      },
      caption: "Guttering & fascia replacement",
    },
  ] satisfies GalleryItem[],

  // --- Colours (also mirrored as CSS variables in globals.css) ----------
  colors: {
    navy: "#0c1f3d",
    navyDark: "#071226",
    orange: "#f0721c",
    orangeDark: "#d9570f",
    cream: "#f7f5f1",
  },

  // --- Misc --------------------------------------------------------------
  // Used to build absolute URLs for Open Graph/Twitter images. Update this
  // once the real Vercel URL (or custom domain) is known.
  siteUrl: "https://coastline-roofing-demo.vercel.app",
  isDemo: true,
} as const;

export type SiteConfig = typeof siteConfig;
