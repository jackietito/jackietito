import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La guía visual de uso es una página estática (public/guia/index.html), servida en /guia.
  async rewrites() {
    return [{ source: "/guia", destination: "/guia/index.html" }];
  },
};

export default nextConfig;
