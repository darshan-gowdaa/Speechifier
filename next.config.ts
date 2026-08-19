import type { NextConfig } from 'next';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

// Ensure pdf.js worker is served from same origin (no CORS, no CDN dependency)
try {
  const src = join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
  const dest = join(process.cwd(), 'public/pdf.worker.min.mjs');
  if (!existsSync(dest)) copyFileSync(src, dest);
} catch (_) {
  // Non-fatal: worker will fall back to CDN URL
}

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
