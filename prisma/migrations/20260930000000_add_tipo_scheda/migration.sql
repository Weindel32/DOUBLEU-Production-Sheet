-- AlterTable
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "tipo" TEXT NOT NULL DEFAULT 'produzione';
