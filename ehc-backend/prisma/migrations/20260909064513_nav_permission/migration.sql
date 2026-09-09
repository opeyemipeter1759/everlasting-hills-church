-- CreateTable
CREATE TABLE "NavPermission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemHref" TEXT NOT NULL,
    "roles" "Role"[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NavPermission_tenantId_itemHref_key" ON "NavPermission"("tenantId", "itemHref");

-- CreateIndex
CREATE INDEX "NavPermission_tenantId_idx" ON "NavPermission"("tenantId");

-- AddForeignKey
ALTER TABLE "NavPermission" ADD CONSTRAINT "NavPermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
