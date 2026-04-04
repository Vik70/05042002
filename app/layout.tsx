import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { BackgroundWallpaper } from "@/components/BackgroundWallpaper";

export const metadata: Metadata = {
  title: "Aanavee: The Four Gifts",
  description:
    "A guided moonlit shrine journey where Simba reveals Aanavee's gifts of precision, flow, insight, and voice.",
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
