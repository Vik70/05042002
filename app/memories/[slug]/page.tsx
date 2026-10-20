import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorDock } from "@/components/editor/EditorDock";
import { DARK_TEMPLATES, MemoryView } from "@/components/memories/MemoryView";
import { getAlbumPhotos } from "@/lib/memories/photos";
import { loadMemory } from "@/lib/memories/store";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadMemory(slug);
  return { title: result?.memory.title ?? "Not found" };
}

export default async function MemoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const result = await loadMemory(slug);
  if (!result) {
    notFound();
  }

  const { memory, previous, next, collection, storage } = result;
  const photos = await getAlbumPhotos(memory.albumUrl);
  const dark = DARK_TEMPLATES.has(memory.template) || (memory.template === "keepsake" && ["dusk", "plum"].includes(memory.palette));

  return (
    <>
      <MemoryView
        memory={memory}
        photos={photos}
        previous={previous}
        next={next}
        collection={collection.map(({ slug: entrySlug, title, startDate, template }) => ({ slug: entrySlug, title, startDate, template }))}
      />
      <EditorDock target={{ kind: "memory", memory }} storageMessage={storage.state === "error" ? storage.message : undefined} tone={dark ? "dark" : "light"} />
    </>
  );
}
