-- CreateTable
CREATE TABLE "Users" (
    "user_id" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Packages" (
    "package_id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "package_name" VARCHAR(255) NOT NULL,
    "download_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Packages_pkey" PRIMARY KEY ("package_id")
);

-- CreateTable
CREATE TABLE "API_Token" (
    "token_id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "num_usage" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "upload_permission" BOOLEAN NOT NULL,
    "search_permission" BOOLEAN NOT NULL,
    "download_permission" BOOLEAN NOT NULL,

    CONSTRAINT "API_Token_pkey" PRIMARY KEY ("token_id")
);

-- AddForeignKey
ALTER TABLE "Packages" ADD CONSTRAINT "Packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "API_Token" ADD CONSTRAINT "API_Token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
