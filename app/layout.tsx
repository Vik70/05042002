import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { BackgroundWallpaper } from "@/components/BackgroundWallpaper";

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
  title: "Happy Birthday, Aanavee | Aanavee: The Four Gifts",
  description:
    "Happy birthday, Aanavee. A cute moonlit shrine journey where Simba reveals your gifts of precision, flow, insight, and voice.",
  openGraph: {
    title: "Happy Birthday, Aanavee",
    description:
      "A little moonlit birthday shrine from Simba, with four gifts waiting to wake just for you.",
    type: "website",
    images: [
      {
        url: shareImagePath,
        width: 512,
        height: 512,
        alt: "Pixel art portrait of Aanavee for The Four Gifts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Happy Birthday, Aanavee",
    description:
      "A little moonlit birthday shrine from Simba, with four gifts waiting to wake just for you.",
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
    <html lang="en">
      <body>
        <BackgroundWallpaper />
        <div className="relative z-0">{children}</div>
      </body>
    </html>
  );
}
