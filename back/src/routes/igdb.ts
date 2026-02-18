import { Router } from "express";
import * as igdbService from "../services/igdb.service";

const r = Router();

r.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.status(400).json({ error: "q required" });

  res.json(await igdbService.searchGames(q));
});

export default r;
