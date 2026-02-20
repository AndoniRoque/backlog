import { Router } from "express";
import { prisma } from "../prisma";
import * as gamesService from "../services/games.service";
import axios from "axios";

const r = Router();

r.get("/", async (req, res) => {
  const { status } = req.query as { status?: string };

  if (
    status &&
    !["BACKLOG", "PLAYING", "COMPLETED", "DROPPED", "PAUSED"].includes(
      status.toUpperCase(),
    )
  )
    return res.status(400).json({ error: "Invalid status value" });

  const games = await gamesService.getGames(status?.toUpperCase() as any);
  res.json(games);
});

r.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id)))
    return res.status(400).json({ error: "Invalid game ID" });
  const game = await gamesService.getGameById(parseInt(id));
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.json(game);
});

r.post("/", async (req, res) => {
  const { igdbId, priority, store } = req.body;
  if (!igdbId || typeof igdbId !== "number")
    return res.status(400).json({ error: "igdbId required" });

  if (
    !priority ||
    !["MAYBE_SOMEDAY", "FAVORITE", "MUST_PLAY"].includes(priority)
  )
    return res.status(400).json({ error: "Invalid priority value" });

  if (store && typeof store !== "string")
    return res.status(400).json({ error: "Invalid store value" });

  const saved = await gamesService.addFromIgdb({ igdbId, priority, store });
  res.status(201).json(saved);
});

r.patch("/:id/priority", async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  if (
    !priority ||
    !["MAYBE_SOMEDAY", "FAVORITE", "MUST_PLAY"].includes(priority)
  )
    return res.status(400).json({ error: "Invalid priority value" });

  const updated = await prisma.game.update({
    where: { igdbId: parseInt(id) },
    data: { priority },
  });
  res.json(updated);
});

r.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (
    !status ||
    !["BACKLOG", "PLAYING", "COMPLETED", "DROPPED", "PAUSED"].includes(status)
  )
    return res.status(400).json({ error: "Invalid status value" });

  const updated = await prisma.game.update({
    where: { igdbId: parseInt(id) },
    data: { status },
  });
  res.json(updated);
});

r.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.game.delete({ where: { igdbId: parseInt(id) } });
  res.json({ ok: true });
});

// r.get("/completed", async (req, res) => {
//   const completedGames = await gamesService.getCompletedGames();
//   res.json(completedGames || []);
// });

// // Cola "Play next"
// r.get("/queue", async (_req, res) => {
//   const queue = await prisma.game.findMany({
//     where: { queuePosition: { not: null } },
//     orderBy: { queuePosition: "asc" },
//   });
//   res.json(queue);
// });

// // Reordenar cola (drag & drop) — recibe array de IDs en el orden final
// r.put("/queue", async (req, res) => {
//   const { orderedIds } = req.body as { orderedIds: string[] };
//   if (!Array.isArray(orderedIds))
//     return res.status(400).json({ error: "orderedIds required" });

//   await prisma.$transaction(
//     orderedIds.map((id, idx) =>
//       prisma.game.update({ where: { id }, data: { queuePosition: idx + 1 } }),
//     ),
//   );

//   res.json({ ok: true });
// });

export default r;
