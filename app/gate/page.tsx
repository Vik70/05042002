import type { Metadata } from "next";
import { TowelGate } from "@/components/gate/TowelGate";

export const metadata: Metadata = {
  title: "Knock knock",
};

const safeNextPath = (value: string | string[] | undefined): string => {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/gate")) {
    return "/";
  }
  return candidate;
};

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <TowelGate nextPath={safeNextPath(params.next)} />;
}
