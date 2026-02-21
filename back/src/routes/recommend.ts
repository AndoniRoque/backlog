import { Router } from "express";
import * as recommendService from "../services/recommend.service"

const r  = Router();

r.get("/random", async (req, res) => {
   const randomGame = await recommendService.getRandomGameFromBacklog()
   res.status(200).json(randomGame)
})

export default r;