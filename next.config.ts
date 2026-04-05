import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CF injects PORT; Next.js reads it automatically via `next start`
  output: "standalone",
};

export default nextConfig;
