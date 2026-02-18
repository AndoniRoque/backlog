import { Router } from "express";
import { prisma } from "../prisma";
import axios from "axios";

const r = Router();

r.get("/artworks", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "falta el parámetro 'id'" });

  const artworks = await fetchArtwork(id);
  res.json(artworks);
});

r.get("/search", async (req, res) => {
  const { name } = req.query;
  if (!name)
    return res.status(400).json({ error: "falta el parámetro 'title'" });

  const query = `search "${name}"; fields summary, name, artworks, genres, release_dates, involved_companies; limit 20;`;
  const games = await getFromIGDB(query);
  res.json(games);
});

// Dashboard: lista + filtros simples
r.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const status = req.query.status as any;
  const priority = req.query.priority as any;

  const games = await prisma.game.findMany({
    where: {
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    },
    orderBy: { title: "asc" },
  });

  res.json(games);
});

r.post("/", async (req, res) => {
  console.log(req);
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
