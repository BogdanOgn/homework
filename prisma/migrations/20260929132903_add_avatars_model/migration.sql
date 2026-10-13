-- CreateTable
CREATE TABLE "avatars" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "avatars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avatars_path_key" ON "avatars"("path");

-- CreateIndex
CREATE INDEX "avatars_user_id_idx" ON "avatars"("user_id");

-- AddForeignKey
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
