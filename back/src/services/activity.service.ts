import { prisma } from "../prisma";

export async function getGameActivity(igdbId: number) {
  return prisma.gameActivity.findMany({
    where: { game: { igdbId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      type: true,
      detail: true,
    },
  });
}

export async function recordGameActivity(
  igdbId: number,
  type: string,
  detail?: string,
) {
  const game = await prisma.game.findUnique({
    where: { igdbId },
    select: { id: true },
  });

  if (!game) return null;

  return prisma.gameActivity.create({
    data: { gameId: game.id, type, detail },
  });
}