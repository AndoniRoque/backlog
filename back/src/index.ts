import "dotenv/config";
import express from "express";
import cors from "cors";

import gamesRouter from "./routes/games";
import stateRouter from "./routes/state";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/games", gamesRouter);
app.use("/state", stateRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);
