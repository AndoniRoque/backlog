import { PriorityTag } from "@prisma/client";
import { prisma } from "../prisma";
import { searchGameInfo } from "./igdb.service";

export async function addFromIgdb(input: {
  igdbId: number;
  priority?: "MAYBE_SOMEDAY" | "FAVORITE" | "MUST_PLAY";
  store?: string;
}) {
  const details = await searchGameInfo(input.igdbId);

  if (!details) throw new Error("Game not found in IGDB.");
  if (!details.igdbId || !details.title) {
    throw new Error("Invalid IGDB details (missing igdbId/title).");
  }

  return prisma.game.upsert({
    where: { igdbId: details.igdbId },
    update: {
      title: details.title,
      summary: details.summary,
      releaseYear: details.releaseYear,
      coverUrl: details.coverUrl,
      heroUrl: details.heroUrl,
      developers: details.developers,
      store: input.store,
      priority: (input.priority || "MAYBE_SOMEDAY") as PriorityTag,
    },
    create: {
      igdbId: details.igdbId,
      title: details.title,
      summary: details.summary,
      releaseYear: details.releaseYear,
      coverUrl: details.coverUrl,
      heroUrl: details.heroUrl,
      developers: details.developers,
      store: input.store,
      priority: (input.priority || "MAYBE_SOMEDAY") as PriorityTag,
    },
  });
}

export async function getGames(
  status:
    | "BACKLOG"
    | "PLAYING"
    | "COMPLETED"
    | "DROPPED"
    | "PAUSED"
    | undefined,
) {
  return prisma.game.findMany({
    where: { status: status || undefined },
    orderBy: { title: "asc" },
  });
}
