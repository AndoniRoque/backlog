import { Router } from "express";
import queueRouter from "./queue";
import gamesRouter from "./games";
import stateRouter from "./state";
import igdbRouter from "./igdb";

const router = Router();

router.use("/games", gamesRouter);
router.use("/state", stateRouter);
router.use("/igdb", igdbRouter);
router.use("/queue", queueRouter);

export default router;
