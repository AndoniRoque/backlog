import { Router } from "express";
import { prisma } from "../prisma";
import * as gamesService from "../services/games.service";
import axios from "axios";
import { parse } from "node:path";

const r = Router();

r.get("/", async (req, res) => {
  const { status, sort, order } = req.query as {
    status?: string;
    order?: string;
    sort?: string;
  };

  if (
    status &&
    !["BACKLOG", "PLAYING", "COMPLETED", "DROPPED", "PAUSED"].includes(
      status.toUpperCase(),
    )
  )
    return res.status(400).json({ error: "Invalid status value" });

  const allowedSortFields = [
    "title",
    "releaseYear",
    "priority",
    "store",
    "status",
    "estimatedHours",
  ] as const;

  const sortKey = (
    allowedSortFields.includes(sort as any) ? sort : "title"
  ) as (typeof allowedSortFields)[number];

  const sortOrder = order === "desc" ? "desc" : "asc";

  const games = await gamesService.getGames({
    status: status?.toUpperCase() as any,
    sort: sortKey,
    order: sortOrder,
  });
  res.json(games);
});

r.get("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;
  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });
  const game = await gamesService.getGameById(parseInt(igdbId));
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

r.patch("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;
  const { title, summary, releaseYear, developers, store } = req.body;

  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });

  const updated = await gamesService.updateGameDetails(parseInt(igdbId), {
    title,
    summary,
    releaseYear,
    developers,
    store,
  });

  res.json(updated);
});

r.patch("/:igdbId/priority", async (req, res) => {
  const { igdbId } = req.params;
  const { priority } = req.body;

  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });

  if (
    !priority ||
    !["MAYBE_SOMEDAY", "FAVORITE", "MUST_PLAY"].includes(priority)
  )
    return res.status(400).json({ error: "Invalid priority value" });

  const updated = await gamesService.updateGamePriority(
    parseInt(igdbId),
    priority,
  );
  res.json(updated);
});

r.patch("/:igdbId/status", async (req, res) => {
  const { igdbId } = req.params;
  const { status } = req.body;

  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });

  if (
    !status ||
    !["BACKLOG", "PLAYING", "COMPLETED", "DROPPED", "PAUSED"].includes(status)
  )
    return res.status(400).json({ error: "Invalid status value" });

  const updated = await gamesService.updateGameStatus(parseInt(igdbId), status);
  res.json(updated);
});

r.delete("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;

  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });

  await gamesService.deleteGame(parseInt(igdbId));
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
