UPDATE "Game"
SET "completedAt" = "updatedAt"
WHERE "completedAt" IS NULL
  AND ("status" = 'COMPLETED' OR "priority" = 'DONE');
