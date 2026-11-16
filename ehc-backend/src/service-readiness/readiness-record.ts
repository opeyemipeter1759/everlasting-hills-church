import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user';
import type { PrismaService } from '../prisma/prisma.service';
import { isChurchAdministrator, unitsHeadedBy } from './readiness-access';

/** A unit's readiness row for a service, after checking this person may act for the unit (its leader, or the Administrator). */
export async function readinessRecordFor(prisma: PrismaService, tenantId: string, actor: AuthUser, serviceId: string, unitId: string) {
  const record = await prisma.serviceReadiness.findFirst({
    where: { tenantId, serviceId, unitId },
    select: { id: true, state: true, Unit: { select: { name: true } }, Service: { select: { serviceType: true } } },
  });
  if (!record) throw new NotFoundException('No plan for this unit at that service');
  const allowed = isChurchAdministrator(actor) || (await unitsHeadedBy(prisma, tenantId, actor)).includes(unitId);
  if (!allowed) throw new ForbiddenException("Only this unit's leader can submit its plan or post updates");
  return record;
}
