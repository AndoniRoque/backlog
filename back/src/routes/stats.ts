import { Router } from "express";
import * as statsService from "../services/stats.service";

const router = Router();

router.get("/", async (req, res) => {
  const requestedYear = req.query.year;
  const year = requestedYear
    ? Number.parseInt(String(requestedYear), 10)
    : new Date().getUTCFullYear();

  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    return res.status(400).json({
      error: "year must be a valid four-digit year",
    });
  }

  const priority = req.query.priority ? String(req.query.priority) : undefined;
  const store = req.query.store ? String(req.query.store) : undefined;

  if (
    priority &&
    !["MAYBE_SOMEDAY", "MUST_PLAY", "FAVORITE", "DONE"].includes(priority)
  ) {
    return res.status(400).json({ error: "Invalid priority value" });
  }

  try {
    const statistics = await statsService.getStatistics(year, {
      store,
      priority,
    });
    return res.json(statistics);
  } catch (error) {
    console.error("Error loading statistics:", error);
    return res.status(500).json({ error: "Failed to load statistics" });
  }
});

export default router;
