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
  },
};

export default nextConfig;
