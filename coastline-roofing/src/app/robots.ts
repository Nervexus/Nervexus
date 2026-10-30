import type { MetadataRoute } from "next";

// This is a sales demo, not a live business — keep every crawler out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
