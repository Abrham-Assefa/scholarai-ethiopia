import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  eslint: {
    // Disable ESLint during builds to avoid breaking CI/CD
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
