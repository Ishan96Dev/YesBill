/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Vercel deployment (full SSR + ISR enabled) ──────────────────────────────
  // Do NOT set output:'export' — Vercel runs a Node.js server so SSR is fully
  // available. GitHub Pages deployment uses a separate static-export branch.

  // ── Asset paths ─────────────────────────────────────────────────────────────
  // Only set basePath / assetPrefix when deploying to GitHub Pages.
  // On Vercel the app is served from the domain root ("/").
  //   basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  //   assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  trailingSlash: false,

  // ── Image Optimization (Vercel handles this for free) ────────────────────────
  images: {
    // Remote domains allowed in <Image src="https://...">
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',   // user avatars stored in Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'grainy-gradients.vercel.app',
      },
    ],
    // Local /public images use Next.js automatic optimisation on Vercel.
    // No need for unoptimized:true here (that is only needed for static export).
    formats: ['image/avif', 'image/webp'],
  },

  // ── React strict mode ────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── TypeScript / ESLint ──────────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ── Webpack tweaks for browser-only libraries ───────────────────────────────
  webpack: (config, { isServer }) => {
    if (isServer) {
      // html2pdf.js directly touches window/document — exclude from SSR bundle
      config.externals = [...(config.externals || []), 'html2pdf.js']
    }
    return config
  },
}

module.exports = nextConfig
