-- CreateTable
CREATE TABLE "UnitMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnitMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitMessage_tenantId_unitId_createdAt_idx" ON "UnitMessage"("tenantId", "unitId", "createdAt");
CREATE INDEX "UnitMessage_unitId_senderId_recipientId_createdAt_idx" ON "UnitMessage"("unitId", "senderId", "recipientId", "createdAt");

-- AddForeignKey
ALTER TABLE "UnitMessage" ADD CONSTRAINT "UnitMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UnitMessage" ADD CONSTRAINT "UnitMessage_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnitMessage" ADD CONSTRAINT "UnitMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UnitMessage" ADD CONSTRAINT "UnitMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
