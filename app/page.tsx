import { EditorDock } from "@/components/editor/EditorDock";
import { HomeCollection } from "@/components/home/HomeCollection";
import { loadSiteContent } from "@/lib/memories/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { home, memories, storage } = await loadSiteContent();

  return (
    <>
      <HomeCollection home={home} memories={memories} />
      <EditorDock target={{ kind: "home", home, memories }} storageMessage={storage.state === "error" ? storage.message : undefined} />
    </>
  );
}
