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

    if (game.queuePosition !== null) {
      await syncPlayingWithQueueHead(tx);
      return game;
    }

    const last = await tx.game.findFirst({
      where: { queuePosition: { not: null } },
      orderBy: { queuePosition: "desc" },
      select: { queuePosition: true },
    });

    const nextPos = (last?.queuePosition ?? 0) + STEP;

    const updated = await tx.game.update({
      where: { igdbId },
      data: { queuePosition: nextPos },
      select: { igdbId: true, title: true, queuePosition: true },
    });

    await syncPlayingWithQueueHead(tx);

    return updated;
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

    await syncPlayingWithQueueHead(tx);

    return true;
  });
}

export async function removeFromQueue(igdbId: number) {
  return prisma.$transaction(async (tx) => {
    const head = await tx.game.findFirst({
      where: { queuePosition: { not: null } },
      orderBy: { queuePosition: "asc" },
      select: { igdbId: true },
    });

    const isHead = head?.igdbId === igdbId;

    const updated = await tx.game.update({
      where: { igdbId },
      data: {
        queuePosition: null,
        ...(isHead ? { status: "COMPLETED" as const } : {}),
      },
      select: { igdbId: true, title: true, queuePosition: true },
    });

    await syncPlayingWithQueueHead(tx);
    return updated;
  });
}

export async function syncPlayingWithQueueHead(tx: any) {
  const head = await tx.game.findFirst({
    where: { queuePosition: { not: null } },
    orderBy: { queuePosition: "asc" },
    select: { igdbId: true },
  });

  if (!head?.igdbId) {
    await tx.game.updateMany({
      where: {
        status: "PLAYING",
      },
      data: {
        status: "BACKLOG",
      },
    });
    return null;
  }

  await tx.game.updateMany({
    where: { status: "PLAYING", igdbId: { not: head.igdbId } },
    data: { status: "BACKLOG" },
  });

  await tx.game.update({
    where: { igdbId: head.igdbId },
    data: { status: "PLAYING" },
  });

  return head.igdbId;
}
