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

export async function getGames(input: {
  status?:
    | "BACKLOG"
    | "PLAYING"
    | "COMPLETED"
    | "DROPPED"
    | "PAUSED"
    | undefined;
  sort?:
    | "title"
    | "releaseYear"
    | "priority"
    | "store"
    | "status"
    | "estimatedHours";
  order?: "asc" | "desc";
}) {
  return prisma.game.findMany({
    where: { status: input.status || undefined },
    orderBy: { [input.sort || "title"]: input.order || "asc" },
  });
}

export async function getGameById(id: number) {
  return prisma.game.findUnique({
    where: { igdbId: id },
  });
}

export async function updateGamePriority(id: number, priority: PriorityTag) {
  return prisma.game.update({
    where: { igdbId: id },
    data: { priority },
  });
}

export async function updateGameStatus(
  id: number,
  status: "BACKLOG" | "PLAYING" | "COMPLETED" | "DROPPED" | "PAUSED",
) {
  return prisma.game.update({
    where: { igdbId: id },
    data: { status },
  });
}

export async function updateGameDetails(
  id: number,
  details: {
    title?: string;
    summary?: string;
    releaseYear?: number;
    developers?: string[];
    store?: string;
  },
) {
  const updateData: any = {};

  if (details.title) updateData.title = details.title;
  if (details.summary) updateData.summary = details.summary;
  if (details.releaseYear) updateData.releaseYear = details.releaseYear;
  if (details.developers) updateData.developers = details.developers;
  if (details.store) updateData.store = details.store;

  const updated = await prisma.game.update({
    where: { igdbId: id },
    data: updateData,
  });

  return updated;
}

export async function deleteGame(id: number) {
  await prisma.game.delete({ where: { igdbId: id } });
}

export async function searchGameByTitle(title: string) {
  return prisma.game.findMany({
    where: { title: { contains: title, mode: "insensitive" } },
    orderBy: { title: "asc" },
  });
}

export async function getGamesByPriority(priority: PriorityTag) {
  return prisma.game.findMany({
    where: { priority },
    orderBy: { title: "asc" },
  });
}

export async function getGamesByStore(store: string) {
  return prisma.game.findMany({
    where: { store: { contains: store, mode: "insensitive" } },
    orderBy: { title: "asc" },
  });
}
