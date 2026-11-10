/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint dependency is shipped; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
