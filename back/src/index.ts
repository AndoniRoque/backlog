import "dotenv/config";
import express from "express";
import cors from "cors";

import routes from "./routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(routes);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);

// TODO: Una ruta "estadísticas o resultados" que me devuelva lo juegado en el año, lo terminado, lo favorito.
