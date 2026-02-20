import { Router } from "express";
import { prisma } from "../prisma";
import * as stateService from "../services/state.service";

const r = Router();

r.get("/", async (req, res) => {
  try {
    const nowPlaying = await stateService.getNowPlayingGame();
    res.json({ nowPlaying });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

export default r;
