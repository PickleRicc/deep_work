import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: We're NOT using static export because this app has API routes.
  // For Capacitor: Deploy Next.js app separately and point Capacitor to that URL.
  // During development: Use localhost:3000
};

export default nextConfig;
