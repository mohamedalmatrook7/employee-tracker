/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep @react-pdf/renderer out of the bundler so its Node-only deps work
    // in the PDF route handlers (Vercel serverless, no headless browser).
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
