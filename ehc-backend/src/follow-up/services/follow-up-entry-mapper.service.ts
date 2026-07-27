import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/types/auth-user';
import type { AbsenteeDetail, EntryWithRelations } from '../follow-up.types';
import { FollowUpAuthService } from './follow-up-auth.service';

/** Shapes a raw FollowUpEntry (+ relations) into the API response row. */
@Injectable()
export class FollowUpEntryMapperService {
  constructor(private readonly auth: FollowUpAuthService) {}

  mapEntry(entry: EntryWithRelations, actor: AuthUser) {
    const person = entry.Member
      ? {
          id: entry.Member.id,
          name: `${entry.Member.firstName} ${entry.Member.lastName}`.trim(),
          photoUrl: entry.Member.photoUrl,
          phone: entry.Member.phone,
          email: entry.Member.email,
        }
      : entry.Visitor
        ? {
            id: entry.Visitor.id,
            name: `${entry.Visitor.firstName} ${entry.Visitor.lastName}`.trim(),
            photoUrl: null as string | null,
            phone: entry.Visitor.phone,
            email: entry.Visitor.email,
          }
        : { id: '', name: 'Unknown', photoUrl: null, phone: null, email: null };

    // Extra detail for the drawer's "Contact & Details" section — shape differs by
    // source since Member and Visitor carry different intake data (a Visitor records
    // who invited them and how they heard about the church; a Member doesn't).
    const personDetail = entry.Member
      ? {
          gender: entry.Member.gender,
          dateOfBirth: entry.Member.dateOfBirth ? entry.Member.dateOfBirth.toISOString() : null,
          address: entry.Member.address,
          memberSince: entry.Member.joinedAt.toISOString() as string | null,
          invitedBy: null as string | null,
          howTheyHeard: null as string | null,
          occupation: null as string | null,
        }
      : entry.Visitor
        ? {
            gender: entry.Visitor.gender,
            dateOfBirth: entry.Visitor.dateOfBirth,
            address: entry.Visitor.address,
            memberSince: null as string | null,
            invitedBy: entry.Visitor.invitedBy,
            howTheyHeard: entry.Visitor.howDidYouLearn,
            occupation: entry.Visitor.occupation,
          }
        : null;

    const addedByMember = entry.AddedBy.Member;
    const addedBy = {
      id: entry.AddedBy.id,
      name: addedByMember ? `${addedByMember.firstName} ${addedByMember.lastName}`.trim() : 'Unknown',
      photoUrl: null as string | null,
    };

    return {
      id: entry.id,
      person,
      personDetail,
      sourceType: entry.sourceType,
      unitId: entry.unitId,
      unitName: entry.Unit.name,
      addedBy,
      addedAt: entry.createdAt.toISOString(),
      assignee: entry.Assignee
        ? {
            id: entry.Assignee.id,
            name: `${entry.Assignee.firstName} ${entry.Assignee.lastName}`.trim(),
            photoUrl: entry.Assignee.photoUrl,
          }
        : null,
      stage: entry.stage,
      goalContacts: entry.goalContacts,
      contactCount: entry.contactCount,
      lastContactAt: entry.lastContactAt?.toISOString() ?? null,
      outcome: entry.outcome,
      reviewNote: entry.reviewNote,
      // Only meaningful for ABSENTEE entries (Member-backed); null for FIRST_TIMER
      // (Visitor-backed — no login account to opt out of).
      memberStatus: entry.Member?.status ?? null,
      logs: entry.Logs.map((l) => ({
        id: l.id,
        by: { id: l.By.id, name: `${l.By.firstName} ${l.By.lastName}`.trim(), photoUrl: l.By.photoUrl },
        at: l.createdAt.toISOString(),
        method: l.method,
        outcome: l.outcome,
        note: l.note,
      })),
      absenteeDetail: null as AbsenteeDetail | null,
      // Per-entry, not a blanket "is this user a leader somewhere" flag — a lead of
      // Production Team can now *see* a Follow-Up-unit entry via the shared pool,
      // but only Follow-Up's own leader (or ADMIN+) may assign/confirm/reject it.
      viewerCanApprove: this.auth.canLead(actor, entry.unitId),
      viewerCanWork: this.auth.canWork(actor, { unitId: entry.unitId, assigneeId: entry.assigneeId }),
    };
  }
}
