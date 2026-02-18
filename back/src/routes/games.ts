import { Router } from "express";
import { prisma } from "../prisma";
import * as gamesService from "../services/games.service";
import axios from "axios";

const r = Router();

r.get("/", async (req, res) => {
  const games = await prisma.game.findMany({
    orderBy: { title: "desc" },
  });
  res.json(games);
});

r.post("/", async (req, res) => {
  const { igdbId, priority } = req.body;
  if (!igdbId || typeof igdbId !== "number")
    return res.status(400).json({ error: "igdbId required" });

  const saved = await gamesService.addFromIgdb({ igdbId, priority });
  res.status(201).json(saved);
});

r.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.game.delete({ where: { igdbId: parseInt(id) } });
  res.json({ ok: true });
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
