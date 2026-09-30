import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the old site's URL shape (/san-pham/abc/) so existing links and SEO carry over.
  trailingSlash: true,
  async redirects() {
    return [
      { source: "/cua-hang/page/:n/", destination: "/cua-hang/?page=:n", permanent: true },
      { source: "/danh-muc/:path*/page/:n/", destination: "/danh-muc/:path*/?page=:n", permanent: true },
      { source: "/tin-tuc/page/:n/", destination: "/tin-tuc/?page=:n", permanent: true },
    ];
  },
  images: {
    // Product/post/banner images live in Supabase Storage (public buckets). Other hosts render unoptimized (see components/site/img.tsx).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    qualities: [75],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
