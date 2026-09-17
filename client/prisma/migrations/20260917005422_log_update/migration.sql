/*
  Warnings:

  - The primary key for the `LogMeal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `LogMeal` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "LogMeal" DROP CONSTRAINT "LogMeal_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD CONSTRAINT "LogMeal_pkey" PRIMARY KEY ("id", "logId", "mealId");
