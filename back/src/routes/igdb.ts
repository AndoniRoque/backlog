import { Router } from "express";
import * as igdbService from "../services/igdb.service";

const r = Router();

r.get("/search", async (req, res) => {
  const name = String(req.query.name ?? req.query.q ?? "").trim();
  if (!name)
    return res.status(400).json({ error: "falta el parámetro 'name'" });

  const games = await igdbService.searchGames(name);
  res.json(games);
});

r.get("/artworks", async (req, res) => {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "falta el parámetro 'id'" });

  const artwork = await igdbService.fetchArtwork(id);
  res.json(artwork);
});

r.get("/artworks/batch", async (req, res) => {
  const idsParam = String(req.query.ids ?? "").trim();
  if (!idsParam)
    return res.status(400).json({ error: "falta el parámetro 'id'" });

  const ids = idsParam
    .split(", ")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const artworks = await igdbService.fetchArtworks(ids);
  res.json(artworks);
});

export default r;
