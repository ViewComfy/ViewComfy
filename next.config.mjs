// import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: { remotePatterns: [{ hostname: "*" }] },
//   output: "standalone",
//   // basePath: "/viewcomfy",
//   assetPrefix: "/viewcomfy",
// };

// export default nextConfig;


// @ts-check
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

export default (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    images: { remotePatterns: [{ hostname: "*" }] },
    output: "standalone",
    assetPrefix: isDev ? undefined : "/viewcomfy",
    basePath: isDev ? undefined : "/viewcomfy",
  }
  return nextConfig
}
