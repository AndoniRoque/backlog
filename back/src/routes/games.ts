import { Router } from "express";
import * as gamesService from "../services/games.service";

const r = Router();

r.get("/", async (req, res) => {
  const { status, sort, order } = req.query as {
    status?: string;
    priority?: string;
    store?: string;
    title?: string;
    releaseYear?: number;
    estimatedHours?: number;
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
    priority: req.query.priority as any,
    store: req.query.store as string,
    title: req.query.title as string,
    releaseYear: req.query.releaseYear
      ? parseInt(req.query.releaseYear as string)
      : undefined,
    estimatedHours: req.query.estimatedHours
      ? parseInt(req.query.estimatedHours as string)
      : undefined,
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

  try {
    const saved = await gamesService.addFromIgdb({ igdbId, priority, store });
    res.status(201).json(saved);
  } catch (error: any) {
    console.error("Error adding game:", error);
    if (error?.isAxiosError) {
      return res.status(502).json({ error: "IGDB error" });
    }
    return res.status(500).json({ error: "Failed to add game" });
  }
});

r.patch("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;
  const { title, summary, releaseYear, developers, store } = req.body;

  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });

  try {
    const updated = await gamesService.updateGameDetails(parseInt(igdbId), {
      title,
      summary,
      releaseYear,
      developers,
      store,
    });

    res.json(updated);
  } catch (error) {
    if ((error as any)?.code === "P2025")
      return res.status(404).json({ error: "Game not found" });
    throw error;
  }
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

  try {
    const updated = await gamesService.updateGamePriority(
      parseInt(igdbId),
      priority,
    );
    res.json(updated);
  } catch (error) {
    if ((error as any)?.code === "P2025")
      return res.status(404).json({ error: "Game not found" });
    throw error;
  }
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

  try {
    const updated = await gamesService.updateGameStatus(
      parseInt(igdbId),
      status,
    );
    res.json(updated);
  } catch (error) {
    if ((error as any)?.code === "P2025")
      return res.status(404).json({ error: "Game not found" });
    throw error;
  }
});

r.delete("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;

  if (isNaN(parseInt(igdbId)))
    return res.status(400).json({ error: "Invalid game ID" });

  try {
    await gamesService.deleteGame(parseInt(igdbId));
    res.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025")
      return res.status(404).json({ error: "Game not found" });
    throw error;
  }
});
