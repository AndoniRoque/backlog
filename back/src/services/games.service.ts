import { PriorityTag } from "@prisma/client";
import { prisma } from "../prisma";
import { searchGameInfo } from "./igdb.service";

export async function addFromIgdb(input: {
  igdbId: number;
  priority?: "NONE" | "FAVORITE" | "MUST_PLAY";
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
      priority: (input.priority || "NONE") as PriorityTag,
    },
    create: {
      igdbId: details.igdbId,
      title: details.title,
      summary: details.summary,
      releaseYear: details.releaseYear,
      coverUrl: details.coverUrl,
      heroUrl: details.heroUrl,
      developers: details.developers,
      priority: (input.priority || "NONE") as PriorityTag,
    },
  });
}
