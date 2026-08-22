import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all development origins so JavaScript chunks hydrate without cross-origin blocks
  // when accessed via local IP, ngrok, or network address
  allowedDevOrigins: [
    '172.168.0.51',
    '172.168.0.51:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
    '0.0.0.0',
    '0.0.0.0:3000',
  ],
};

export default nextConfig;
