/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail production builds on ESLint errors (e.g. unused vars).
    // Lint locally with `npm run lint`; deploys won't be blocked by lint.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Keep @react-pdf/renderer out of the bundler so its Node-only deps work
    // in the PDF route handlers (Vercel serverless, no headless browser).
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // The PDF routes read the Cairo .ttf files at runtime via a dynamic path,
    // which Next's tracer can't see — so force them into the serverless bundle.
    // Without this the fonts are missing on Vercel and the routes 500.
    outputFileTracingIncludes: {
      "/api/reports/**": ["./src/lib/pdf/fonts/**"],
    },
  },
};

export default nextConfig;
