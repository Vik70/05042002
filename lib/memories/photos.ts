import type { AlbumPhoto } from "@/lib/memories/types";

const ALLOWED_HOSTS = new Set(["photos.app.goo.gl", "photos.google.com", "goo.gl"]);
const PHOTO_PATTERN = /\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]+)",(\d+),(\d+)/g;
const MAX_PHOTOS = 80;

export const isGooglePhotosUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

// Google removed API access to shared albums, so this reads the public share page the same way a
// browser would. If Google changes that page the gallery quietly falls back to an album link.
export const getAlbumPhotos = async (albumUrl: string): Promise<AlbumPhoto[]> => {
  if (!albumUrl || !isGooglePhotosUrl(albumUrl)) {
    return [];
  }

  try {
    const response = await fetch(albumUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
        Cookie: "CONSENT=YES+cb; SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg",
      },
      redirect: "follow",
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok || !ALLOWED_HOSTS.has(new URL(response.url).hostname)) {
      return [];
    }

    const html = await response.text();
    const seen = new Set<string>();
    const photos: AlbumPhoto[] = [];

    for (const match of html.matchAll(PHOTO_PATTERN)) {
      const [, src, width, height] = match;
      if (seen.has(src)) {
        continue;
      }
      seen.add(src);
      photos.push({ src, width: Number(width), height: Number(height) });
      if (photos.length >= MAX_PHOTOS) {
        break;
      }
    }

    return photos;
  } catch (error) {
    console.warn("Could not read Google Photos album", error);
    return [];
  }
};
