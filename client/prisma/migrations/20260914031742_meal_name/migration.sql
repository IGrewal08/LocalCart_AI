/*
  Warnings:

  - Added the required column `name` to the `Meal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "name" TEXT NOT NULL;
