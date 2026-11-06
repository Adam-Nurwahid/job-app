-- CreateEnum
CREATE TYPE "Role" AS ENUM ('JOB_SEEKER', 'COMPANY');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "type" "JobType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "coverLetter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "id" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,

    CONSTRAINT "ApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Application_seekerId_idx" ON "Application"("seekerId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_seekerId_key" ON "Application"("jobId", "seekerId");

-- CreateIndex
CREATE INDEX "ApplicationHistory_applicationId_idx" ON "ApplicationHistory"("applicationId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
