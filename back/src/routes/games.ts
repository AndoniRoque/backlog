import { Router } from "express";
import { prisma } from "../prisma";
import * as gamesService from "../services/games.service";
import axios from "axios";

const r = Router();

r.post("/add-game", async (req, res) => {
  const { igdbId, priority } = req.body;
  if (!igdbId || typeof igdbId !== "number")
    return res.status(400).json({ error: "igdbId required" });

  const saved = await gamesService.addFromIgdb({ igdbId, priority });
  res.status(201).json(saved);
});

// Cola "Play next"
r.get("/queue", async (_req, res) => {
  const queue = await prisma.game.findMany({
    where: { queuePosition: { not: null } },
    orderBy: { queuePosition: "asc" },
  });
  res.json(queue);
});

// Reordenar cola (drag & drop) — recibe array de IDs en el orden final
r.put("/queue", async (req, res) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds))
    return res.status(400).json({ error: "orderedIds required" });

  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.game.update({ where: { id }, data: { queuePosition: idx + 1 } }),
    ),
  );

  res.json({ ok: true });
});

export default r;
