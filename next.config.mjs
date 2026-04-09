/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // data/scores/ is committed to git so it's included in the Vercel build automatically.
  // No extra config needed — Next.js reads JSON files from the project root at runtime.
};

export default nextConfig;
