import type { ComponentType } from "react";
import type { MemoryTemplateProps } from "@/components/memories/shared";
import { FourGiftsMemory } from "@/components/memories/templates/FourGiftsMemory";
import { GoldenHourMemory } from "@/components/memories/templates/GoldenHourMemory";
import { KeepsakeMemory } from "@/components/memories/templates/KeepsakeMemory";
import { NightDriveMemory } from "@/components/memories/templates/NightDriveMemory";
import { SevenMonthsMemory } from "@/components/memories/templates/SevenMonthsMemory";
import { SixMonthsMemory } from "@/components/memories/templates/SixMonthsMemory";
import { SpainMemory } from "@/components/memories/templates/SpainMemory";
import { TreasureHuntMemory } from "@/components/memories/templates/TreasureHuntMemory";
import type { TemplateId } from "@/lib/memories/types";

const VIEWS: Record<TemplateId, ComponentType<MemoryTemplateProps>> = {
  "four-gifts": FourGiftsMemory,
  "night-drive": NightDriveMemory,
  "treasure-hunt": TreasureHuntMemory,
  "golden-hour": GoldenHourMemory,
  spain: SpainMemory,
  "six-months": SixMonthsMemory,
  "seven-months": SevenMonthsMemory,
  keepsake: KeepsakeMemory,
};

export const DARK_TEMPLATES = new Set<TemplateId>(["four-gifts", "night-drive", "six-months", "seven-months"]);

export function MemoryView(props: MemoryTemplateProps) {
  const View = VIEWS[props.memory.template] ?? KeepsakeMemory;
  return <View {...props} />;
}
