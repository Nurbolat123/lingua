import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Минимальный образ для Docker: только нужные файлы и зависимости в .next/standalone
  output: "standalone",
};

export default nextConfig;
