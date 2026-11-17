import { Prisma, Role } from '@prisma/client';

type Db = Prisma.TransactionClient;

/** Who may override a unit's team leads on an approval, flagged and audited. */
export const OVERRIDE_ROLES: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];
/** Who is told, and who decides, when a unit has no team leads at all, and for the kinds only admins decide. */
export const FALLBACK_ADMIN_ROLES: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

/** Kinds the admins decide whatever the unit: creating a member account is an admin's job. */
export const ADMIN_DECIDED_KINDS = new Set(['MEMBER_ACCOUNT']);

export type DeciderLevel = 'LEAD' | 'HEAD' | 'ADMIN';

export interface UnitDeciders {
  level: DeciderLevel;
  /** Profile ids. */
  profileIds: string[];
}

/** What a request needs to say for its deciders to be worked out. */
export interface DecidedThing {
  kind: string;
  unitId: string;
}

/** The department head(s) over a unit, from both assignment tables. */
export async function departmentHeadsOf(db: Db, tenantId: string, unitId: string): Promise<string[]> {
  const unit = await db.unit.findFirst({ where: { id: unitId, tenantId }, select: { departmentId: true } });
  if (!unit?.departmentId) return [];
  const where = { tenantId, departmentId: unit.departmentId, endedAt: null };
  const [heads, hods] = await Promise.all([
    db.departmentHead.findMany({ where, select: { userId: true } }),
    db.departmentHod.findMany({ where, select: { userId: true } }),
  ]);
  return [...new Set([...heads.map((h) => h.userId), ...hods.map((h) => h.userId)])];
}

/** Active holders of any of these role grants. */
export async function roleHolders(db: Db, tenantId: string, roles: Role[]): Promise<string[]> {
  const grants = await db.roleGrant.findMany({
    where: { tenantId, role: { in: roles }, endedAt: null },
    select: { userId: true },
  });
  return [...new Set(grants.map((g) => g.userId))];
}

/**
 * A unit's team leads right now, read from the assignment rows (never a cached
 * role set): whoever holds its unit-lead assignment together with the head(s)
 * of its department, any one of whom decides. With neither, the admins. A lead
 * who changes takes the pending items with them, because nothing about a
 * request names a person.
 */
export async function decidersForUnit(db: Db, tenantId: string, unitId: string): Promise<UnitDeciders> {
  const [leads, heads] = await Promise.all([
    db.unitLeadAssignment.findMany({ where: { tenantId, unitId, endedAt: null }, select: { userId: true } }),
    departmentHeadsOf(db, tenantId, unitId),
  ]);
  const profileIds = [...new Set([...leads.map((l) => l.userId), ...heads])];
  if (profileIds.length) return { level: leads.length ? 'LEAD' : 'HEAD', profileIds };
  return { level: 'ADMIN', profileIds: await roleHolders(db, tenantId, FALLBACK_ADMIN_ROLES) };
}

/** Who decides this request: the admins for an admin kind, else the unit's team leads. */
export async function decidersFor(db: Db, tenantId: string, thing: DecidedThing): Promise<UnitDeciders> {
  if (ADMIN_DECIDED_KINDS.has(thing.kind)) return { level: 'ADMIN', profileIds: await roleHolders(db, tenantId, FALLBACK_ADMIN_ROLES) };
  return decidersForUnit(db, tenantId, thing.unitId);
}

export interface Authority {
  allowed: boolean;
  /** An admin deciding in place of the unit's team leads. */
  override: boolean;
  level: DeciderLevel;
}

/** Whether this profile may decide the request now, and whether it would be an admin override. */
export async function authorityFor(db: Db, tenantId: string, thing: DecidedThing, profileId: string | null): Promise<Authority> {
  const deciders = await decidersFor(db, tenantId, thing);
  if (!profileId) return { allowed: false, override: false, level: deciders.level };
  if (deciders.profileIds.includes(profileId)) return { allowed: true, override: false, level: deciders.level };
  const admin = await db.roleGrant.findFirst({
    where: { tenantId, userId: profileId, role: { in: OVERRIDE_ROLES }, endedAt: null },
    select: { id: true },
  });
  if (!admin) return { allowed: false, override: false, level: deciders.level };
  // With nobody above them in the unit, an admin is the rightful decider, not an override.
  return { allowed: true, override: deciders.level !== 'ADMIN', level: deciders.level };
}
