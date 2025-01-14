/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ hostname: "*" }] },
  output: "standalone",
};

export default nextConfig;
