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

export default r;
