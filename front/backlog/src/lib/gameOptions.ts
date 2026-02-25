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
  "FAVORITE",
  "MUST_PLAY",
  "MAYBE_SOMEDAY",
] as const;

export const STATUS_OPTIONS = [
  "BACKLOG",
  "PLAYING",
  "COMPLETED",
  "DROPPED",
  "PAUSED",
];

export type StoreOption = (typeof STORE_OPTIONS)[number];
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];
export type StatusOption = (typeof STATUS_OPTIONS)[number];
