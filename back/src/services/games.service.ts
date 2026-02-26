import { PriorityTag } from "@prisma/client";
import { prisma } from "../prisma";
import { searchGameInfo } from "./igdb.service";
import { syncPlayingWithQueueHead } from "./queue.service";
type Status = "BACKLOG" | "PLAYING" | "COMPLETED" | "DROPPED" | "PAUSED";

export async function addFromIgdb(input: {
  igdbId: number;
  priority?: "MAYBE_SOMEDAY" | "FAVORITE" | "MUST_PLAY";
  store?: string;
  estimatedHours?: number;
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
      estimatedHours: input.estimatedHours,
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
      estimatedHours: input.estimatedHours,
    },
  });
}

export async function getGames(input: {
  status?: Status;
  title?: string;
  releaseYear?: number;
  estimatedHours?: number;
  priority?: PriorityTag;
  store?: string;
  sort?:
    | "title"
    | "releaseYear"
    | "priority"
    | "store"
    | "status"
    | "estimatedHours";
  order?: "asc" | "desc";
}) {
  const sort = input.sort || "title";
  const order = input.order === "desc" ? "desc" : "asc";

  return prisma.game.findMany({
    where: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.title
        ? { title: { contains: input.title, mode: "insensitive" } }
        : {}),
      ...(input.releaseYear ? { releaseYear: input.releaseYear } : {}),
      ...(input.estimatedHours ? { estimatedHours: input.estimatedHours } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.store
        ? { store: { contains: input.store, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ [sort]: order }, { title: "asc" }],
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
    estimatedHours?: number;
    status: Status;
    priority: PriorityTag;
  },
) {
  const updateData: any = {};

  if (details.title) updateData.title = details.title;
  if (details.summary) updateData.summary = details.summary;
  if (details.releaseYear) updateData.releaseYear = details.releaseYear;
  if (details.developers) updateData.developers = details.developers;
  if (details.store) updateData.store = details.store;
  if (details.estimatedHours)
    updateData.estimatedHours = details.estimatedHours;
  if (details.status) updateData.status = details.status;
  if (details.priority) updateData.priority = details.priority;

  const updated = await prisma.game.update({
    where: { igdbId: id },
    data: updateData,
  });

  return updated;
}

export async function deleteGame(igdbId: number) {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { igdbId },
      select: { igdbId: true, status: true, queuePosition: true },
    });

    if (!game) throw new Error("Game not found");

    if (game.queuePosition !== null) {
      await tx.game.update({
        where: { igdbId },
        data: { queuePosition: null },
      });
    }

    await tx.game.delete({
      where: { igdbId },
    });

    await syncPlayingWithQueueHead(tx);

    return true;
  });
}
