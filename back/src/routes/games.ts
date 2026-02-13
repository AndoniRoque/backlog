import { Router } from "express";
import { prisma } from "../prisma";

const r = Router();

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
