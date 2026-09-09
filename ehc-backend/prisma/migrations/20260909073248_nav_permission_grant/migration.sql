-- CreateEnum
CREATE TYPE "NavGrantType" AS ENUM ('MEMBER', 'UNIT_MEMBER', 'UNIT_LEAD');

-- CreateTable
CREATE TABLE "NavPermissionGrant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemHref" TEXT NOT NULL,
    "type" "NavGrantType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NavPermissionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NavPermissionGrant_tenantId_itemHref_type_targetId_key" ON "NavPermissionGrant"("tenantId", "itemHref", "type", "targetId");

-- CreateIndex
CREATE INDEX "NavPermissionGrant_tenantId_itemHref_idx" ON "NavPermissionGrant"("tenantId", "itemHref");

-- CreateIndex
CREATE INDEX "NavPermissionGrant_tenantId_targetId_idx" ON "NavPermissionGrant"("tenantId", "targetId");

-- AddForeignKey
ALTER TABLE "NavPermissionGrant" ADD CONSTRAINT "NavPermissionGrant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
