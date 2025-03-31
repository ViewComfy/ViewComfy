/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ hostname: "*" }] },
  output: "standalone",
  basePath: "/viewcomfy",
};

export default nextConfig;
