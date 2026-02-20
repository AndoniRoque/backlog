import { prisma } from "../prisma";

export async function getNowPlayingGame() {
  return prisma.game.findFirst({
    where: { status: "PLAYING" },
    orderBy: { updatedAt: "desc" },
  });
}
