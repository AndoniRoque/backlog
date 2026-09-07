import { Router } from "express";
import * as queueService from "../services/queue.service";

const r = Router();

r.get("/", async (req, res) => {
  const queue = await queueService.getQueue();
  res.json(queue);
});

r.post("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;

  if (isNaN(parseInt(igdbId))) {
    return res.status(400).json({ error: "Invalid igdbId" });
  }

  try {
    await queueService.addToQueue(parseInt(igdbId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

r.put("/", async (req, res) => {
  const { igdbIds } = req.body;

  if (!Array.isArray(igdbIds) || igdbIds.some((x) => typeof x !== "number")) {
    return res.status(400).json({ error: "Invalid igdbIds" });
  }

  try {
    await queueService.setQueueOrder(igdbIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Invalid payload" });
  }
});

r.delete("/:igdbId", async (req, res) => {
  const { igdbId } = req.params;

  if (isNaN(parseInt(igdbId))) {
    return res.status(400).json({ error: "Invalid igdbId" });
  }

  try {
    await queueService.removeFromQueue(parseInt(igdbId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

r.post("/:igdbId/complete", async (req, res) => {
  const { igdbId } = req.params;
  const { priority, personalNote, completedAt } = req.body;

  if (isNaN(parseInt(igdbId))) {
    return res.status(400).json({ error: "Invalid igdbId" });
  }

  if (priority !== "FAVORITE" && priority !== "DONE") {
    return res.status(400).json({ error: "Invalid completion priority" });
  }

  if (
    personalNote !== undefined &&
    personalNote !== null &&
    typeof personalNote !== "string"
  ) {
    return res.status(400).json({ error: "Invalid personal note" });
  }

  if (completedAt !== undefined && typeof completedAt !== "string") {
    return res.status(400).json({ error: "Invalid completion date" });
  }

  try {
    const completed = await queueService.completeFromQueue(
      parseInt(igdbId),
      priority,
      personalNote,
      completedAt,
    );
    res.json(completed);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default r;
