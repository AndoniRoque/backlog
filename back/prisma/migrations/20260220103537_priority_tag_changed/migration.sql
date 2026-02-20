/*
  Warnings:

  - The values [NONE] on the enum `PriorityTag` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PriorityTag_new" AS ENUM ('MAYBE_SOMEDAY', 'FAVORITE', 'MUST_PLAY');
ALTER TABLE "public"."Game" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "priority" TYPE "PriorityTag_new" USING ("priority"::text::"PriorityTag_new");
ALTER TYPE "PriorityTag" RENAME TO "PriorityTag_old";
ALTER TYPE "PriorityTag_new" RENAME TO "PriorityTag";
DROP TYPE "public"."PriorityTag_old";
ALTER TABLE "Game" ALTER COLUMN "priority" SET DEFAULT 'MAYBE_SOMEDAY';
COMMIT;

-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "priority" SET DEFAULT 'MAYBE_SOMEDAY';
