import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Every asset sits behind the towel gate, and the optimizer fetches images without the visitor's cookie.
  images: { unoptimized: true },
  async redirects() {
    return [{ source: "/game", destination: "/memories/four-gifts/play", permanent: false }];
  },
};

export default nextConfig;
