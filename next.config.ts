import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Probni build može ići u posebnu fasciklu (NEXT_DIST_DIR=.next-test),
  // da ne smeta pokrenutom `npm run dev`, koji koristi .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
