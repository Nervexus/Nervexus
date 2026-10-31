import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Loaded from node_modules at runtime rather than bundled: the Excel
  // reader's unzip dependency has an optional AWS import the bundler can't resolve.
  serverExternalPackages: ["read-excel-file", "unzipper"],
  // The migrate route reads the SQL files at runtime.
  outputFileTracingIncludes: { "/api/admin/migrate": ["./prisma/migrations/**/*"] },
  partialPrefetching: true,
  // Pin the root to this app: on Vercel it otherwise resolves to the monorepo
  // root and next/font/google fails to resolve its font files.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
