-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_login" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "recipient_login" TEXT NOT NULL,
    "sendedBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_transactions_sender_id_idx" ON "balance_transactions"("sender_id");

-- CreateIndex
CREATE INDEX "balance_transactions_recipient_id_idx" ON "balance_transactions"("recipient_id");

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
