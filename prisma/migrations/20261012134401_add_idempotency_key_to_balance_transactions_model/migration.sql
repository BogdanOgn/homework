/*
  Warnings:

  - Added the required column `idempotency_key` to the `balance_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "balance_transactions" ADD COLUMN     "idempotency_key" UUID NOT NULL;
