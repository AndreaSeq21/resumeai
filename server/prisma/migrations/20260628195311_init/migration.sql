-- CreateTable
CREATE TABLE "Analysis" (
    "id" SERIAL NOT NULL,
    "resume" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "matchScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);
