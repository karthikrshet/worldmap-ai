import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output for Docker production builds
  output: "standalone",

  // Turbopack config — set root explicitly so monorepo detection works correctly
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
