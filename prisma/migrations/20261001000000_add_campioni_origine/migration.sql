-- AlterTable
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "campioni" TEXT;
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "origineId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Scheda_origineId_idx" ON "Scheda"("origineId");
