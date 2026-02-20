import { prisma } from "../prisma";

const STEP = 10;

export async function getQueue() {
  return prisma.game.findMany({
    where: {
      queuePosition: {
        not: null,
      },
    },
    select: {
      igdbId: true,
      title: true,
      queuePosition: true,
    },
    orderBy: [{ queuePosition: "asc" }, { title: "asc" }],
  });
}

export async function addToQueue(igdbId: number) {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { igdbId },
      select: { igdbId: true, title: true, queuePosition: true },
    });
    if (!game) throw new Error("Game not found");

    if (game.queuePosition !== null) return game;

    const last = await tx.game.findFirst({
      where: { queuePosition: { not: null } },
      orderBy: { queuePosition: "desc" },
      select: { queuePosition: true },
    });

    const nextPos = (last?.queuePosition ?? 0) + STEP;

    return tx.game.update({
      where: { igdbId },
      data: { queuePosition: nextPos },
      select: { igdbId: true, title: true, queuePosition: true },
    });
  });
}

export async function setQueueOrder(igdbIds: number[]) {
  if (!Array.isArray(igdbIds) || igdbIds.some((x) => typeof x !== "number")) {
    throw new Error("Invalid input: expected an array of numbers");
  }

  const uniq = new Set(igdbIds);

  if (uniq.size !== igdbIds.length) throw new Error("Duplicate igdbIds");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.game.findMany({
      where: { igdbId: { in: igdbIds } },
      select: { igdbId: true },
    });

    if (existing.length !== igdbIds.length) {
      throw new Error("Some igdbIds not found in database");
    }

    await tx.game.updateMany({
      where: { igdbId: { in: igdbIds } },
      data: { queuePosition: null },
    });

    for (let i = 0; i < igdbIds.length; i++) {
      await tx.game.update({
        where: { igdbId: igdbIds[i] },
        data: { queuePosition: (i + 1) * STEP },
      });
    }

    return true;
  });
}

export async function removeFromQueue(igdbId: number) {
  return prisma.game.update({
    where: { igdbId },
    data: { queuePosition: null },
    select: { igdbId: true, title: true, queuePosition: true },
  });
}
