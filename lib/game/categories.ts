import type { EntryCategory } from "@/types/database";

/** Every round has one player from each tier, shown in this order. */
export const CATEGORY_ORDER: EntryCategory[] = ["easy", "medium", "hard"];

export const CATEGORY_LABEL: Record<EntryCategory, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** The games band each tier is drawn from -- shown next to the label. */
export const CATEGORY_HINT: Record<EntryCategory, string> = {
  easy: "200+ games",
  medium: "100–199 games",
  hard: "50–99 games",
};
