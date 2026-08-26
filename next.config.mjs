/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail production builds on ESLint errors (e.g. unused vars).
    // Lint locally with `npm run lint`; deploys won't be blocked by lint.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Don't reuse the client-side Router Cache across navigations. Data here is
    // read fresh on every request (force-dynamic), but Next still caches the
    // rendered RSC payload per route on the client for a while — so navigating
    // away and back could show a stale list (e.g. employees added/removed since
    // the page was last prefetched) until a hard refresh. Setting both to 0
    // makes every navigation refetch, keeping lists live without a manual reload.
    staleTimes: { dynamic: 0, static: 0 },
    // Keep @react-pdf/renderer out of the bundler so its Node-only deps work
    // in the PDF route handlers (Vercel serverless, no headless browser).
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // The PDF routes load font data at runtime that Next's tracer can't see, so
    // force it into the serverless bundle — otherwise the routes 500 on Vercel:
    //   • our Cairo .ttf files (read via a dynamic process.cwd() path)
    //   • pdfkit's built-in standard fonts + AFM metrics (Helvetica.cjs, etc.),
    //     which @react-pdf/renderer requires even when a custom font is used.
    outputFileTracingIncludes: {
      "/api/reports/**": [
        "./src/lib/pdf/fonts/**",
        "./node_modules/pdfkit/js/standard-fonts/**",
        "./node_modules/pdfkit/js/data/**",
      ],
    },
  },
};

export default nextConfig;
