import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Sans } from "next/font/google";
import { getSettings } from "@/lib/data";
import "./globals.css";

const display = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = IBM_Plex_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#0369a1" };

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: general.seo_title, template: `%s | ${general.site_name}` },
    description: general.seo_description,
    icons: { icon: general.favicon },
    openGraph: {
      siteName: general.site_name,
      locale: "vi_VN",
      type: "website",
      images: general.og_image ? [general.og_image] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
