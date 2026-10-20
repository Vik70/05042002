import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackgroundWallpaper } from "@/components/BackgroundWallpaper";
import { GameExperience } from "@/components/GameExperience";

export const metadata: Metadata = {
  title: "The Four Gifts",
};

export default async function PlayMemoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "four-gifts") {
    notFound();
  }

  return (
    <>
      <BackgroundWallpaper />
      <div className="relative z-0">
        <GameExperience />
      </div>
    </>
  );
}
