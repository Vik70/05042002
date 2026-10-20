import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { fontVariables } from "@/app/fonts";

const faviconBasePath = encodeURI("/favicon_io (1)");
const shareImagePath = `${faviconBasePath}/android-chrome-512x512.png`;
const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000";
const normalizedSiteUrl =
  rawSiteUrl.startsWith("http://") || rawSiteUrl.startsWith("https://")
    ? rawSiteUrl
    : rawSiteUrl.includes("localhost")
      ? `http://${rawSiteUrl}`
      : `https://${rawSiteUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: {
    default: "Us, so far",
    template: "%s · Us, so far",
  },
  description: "A little museum of our moments.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Us, so far",
    description: "A little museum of our moments. The towel goes on the rail.",
    type: "website",
    images: [
      {
        url: shareImagePath,
        width: 512,
        height: 512,
        alt: "Pixel art portrait of Aanavee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Us, so far",
    description: "A little museum of our moments. The towel goes on the rail.",
    images: [shareImagePath],
  },
  manifest: `${faviconBasePath}/site.webmanifest`,
  icons: {
    icon: [
      { url: `${faviconBasePath}/favicon.ico` },
      { url: `${faviconBasePath}/android-chrome-192x192.png`, sizes: "192x192", type: "image/png" },
      { url: `${faviconBasePath}/android-chrome-512x512.png`, sizes: "512x512", type: "image/png" },
    ],
    shortcut: `${faviconBasePath}/favicon.ico`,
    apple: `${faviconBasePath}/android-chrome-192x192.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <div className="relative z-0">{children}</div>
      </body>
    </html>
  );
}
