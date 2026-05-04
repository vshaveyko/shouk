-- Make phoneNumber unique so we can upsert users by phone (e.g. WhatsApp group sync).
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
