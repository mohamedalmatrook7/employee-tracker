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
