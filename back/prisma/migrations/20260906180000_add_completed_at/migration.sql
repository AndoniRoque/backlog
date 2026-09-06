ALTER TABLE "Game" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "Game_completedAt_idx" ON "Game"("completedAt");
