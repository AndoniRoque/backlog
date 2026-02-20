import { Router } from "express";
import { prisma } from "../prisma";

const r = Router();

r.get("/", async (_req, res) => {
  const state = await prisma.appState.findFirst();
  res.json(state);
});

r.put("/now-playing", async (req, res) => {
  const { gameId } = req.body as { gameId: string | null };

  const state = await prisma.appState.upsert({
    where: { id: 1 },
    update: { nowPlayingGameIgdbId: gameId ?? null },
    create: { id: 1, nowPlayingGameIgdbId: gameId ?? null },
    include: { nowPlayingGame: true },
  });

  res.json(state);
});

export default r;
