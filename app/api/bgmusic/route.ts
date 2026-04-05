import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const SUPPORTED_AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg", ".webm"]);

const toTrackLabel = (fileName: string): string =>
  decodeURIComponent(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function GET() {
  const musicDirectory = path.join(process.cwd(), "public", "audio", "bgmusic");

  try {
    const entries = await readdir(musicDirectory, { withFileTypes: true });
    const tracks = entries
      .filter((entry) => {
        if (!entry.isFile()) {
          return false;
        }

        const extension = path.extname(entry.name).toLowerCase();
        return SUPPORTED_AUDIO_EXTENSIONS.has(extension) && !entry.name.startsWith(".");
      })
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" }),
      )
      .map((entry, index) => ({
        id: `bgm-track-${index + 1}`,
        src: encodeURI(`/audio/bgmusic/${entry.name}`),
        label: toTrackLabel(entry.name),
      }));

    return NextResponse.json({ tracks });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ tracks: [] });
    }

    console.error("Failed to read background music directory", error);
    return NextResponse.json({ tracks: [] }, { status: 500 });
  }
}
