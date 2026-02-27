// src/lib/types.ts
export type GameStatus =
  | "BACKLOG"
  | "PLAYING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED";

export type PriorityTag = "MAYBE_SOMEDAY" | "FAVORITE" | "MUST_PLAY" | "DONE";

export type Game = {
  igdbId: number | null;
  title: string;
  status: GameStatus;
  priority: PriorityTag;
  store: string | null;
  releaseYear: number | null;
  estimatedHours: number | null;
  coverUrl: string | null;
  heroUrl: string | null;
  queuePosition: number | null;
  summary?: string | null;
  developers?: string[] | null;
};

export type QueueItem = {
  igdbId: number;
  title: string;
  queuePosition: number | null;
};

export type StateResponse = {
  nowPlaying: Game | null;
};

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
  "DONE",
] as const;

export const STATUS_OPTIONS = [
  "BACKLOG",
  "PLAYING",
  "COMPLETED",
  "DROPPED",
  "PAUSED",
];
