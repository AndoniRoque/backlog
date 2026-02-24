// src/lib/gameOptions.ts
export const STORE_OPTIONS = [
  "Steam",
  "Epic",
  "Xbox",
  "PlayStation",
  "Nintendo",
  "GOG",
  "Origin",
  "Uplay",
  "Itch.io",
] as const;

export const PRIORITY_OPTIONS = [
  "FAVORITES",
  "MUST_PLAY",
  "MAYBE_SOMEDAY",
] as const;

export type StoreOption = (typeof STORE_OPTIONS)[number];
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];
