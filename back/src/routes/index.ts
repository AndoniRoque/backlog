import { Router } from "express";
import queueRouter from "./queue";
import gamesRouter from "./games";
import stateRouter from "./state";
import igdbRouter from "./igdb";
import recommendRouter from "./recommend"
import statsRouter from "./stats";

const router = Router();

router.use("/games", gamesRouter);
router.use("/state", stateRouter);
router.use("/igdb", igdbRouter);
router.use("/queue", queueRouter);
router.use("/recommend", recommendRouter)
router.use("/stats", statsRouter);

export default router;

// TODO: implementar cambiar el estado en queue para juego de queue
