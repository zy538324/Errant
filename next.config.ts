import type { NextConfig } from "next";
import path from "node:path";

const enableEmbeddedStudio =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_EMBEDDED_STUDIO === "true";

function toRemotePathPattern(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "");
  return normalizedPath ? `${normalizedPath}/**` : "/**";
}

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "cdn.sanity.io",
    pathname: "/**",
  },
  {
    // Cloudflare R2 public r2.dev bucket URL
    protocol: "https",
    hostname: "pub-6b53eec07e464d068053143a90fad267.r2.dev",
    pathname: "/**",
  },
  {
    // Cloudflare R2 private S3-compatible API endpoint (for signed/admin use)
    protocol: "https",
    hostname: "2c991ae448fe54d9153489400a814531.eu.r2.cloudflarestorage.com",
    pathname: "/errant-arts/**",
  },
];

const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();
if (r2PublicBaseUrl) {
  try {
    const url = new URL(r2PublicBaseUrl);
    remotePatterns.push({
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      pathname: toRemotePathPattern(url.pathname),
    });
  } catch {
    // Ignore invalid custom base URLs and fall back to the static defaults.
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  experimental: {
    workerThreads: false,
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
  eslint: {
    // Lint is run separately in development/CI.
    // This avoids environment-specific EPERM spawn failures during production builds.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type safety is enforced via `npm run typecheck`.
    // This avoids environment-specific EPERM spawn failures during `next build`.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns,
    localPatterns: [
      {
        // Allow locally-served proxied images that include query parameters
        pathname: "/api/images/**",
      },
      {
        // Allow the hosted-preview proxy path when we need to fall back to it.
        pathname: "/api/protected-image",
      },
      {
        // Allow static images served from the public folder (e.g. /logo.png)
        pathname: "/logo.png",
      },
      {
        pathname: "/logo-black-and-white.png",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }

    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["@/studio/runtime"] = path.resolve(
      process.cwd(),
      enableEmbeddedStudio
        ? "src/studio/runtime-enabled.tsx"
        : "src/studio/runtime-disabled.tsx",
    );

    return config;
  },
};

export default nextConfig;
