import type { Metadata } from "next";
import { TogetherGame } from "@/components/together/TogetherGame";

export const metadata: Metadata = {
  title: "Seven Sparks",
};

export default function TogetherPage() {
  return <TogetherGame />;
}
