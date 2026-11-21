import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/cron/newsletters": ["./src/lib/send_email.py"],
  },
};

export default nextConfig;
