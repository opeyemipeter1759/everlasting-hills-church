import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateUserDto } from '../dto/user.dto';
import { UsersCreateService } from './users-create.service';

@Injectable()
export class UsersBulkCreateService {
  constructor(private readonly usersCreate: UsersCreateService) {}

  /**
   * Create several people in one submission. Each row goes through the same
   * single-create path (Supabase auth + Profile + Member + welcome email).
   * A failure on one row does NOT abort the batch — failures are collected and
   * returned so the UI can report exactly which rows need fixing.
   */
  async bulkCreate(actor: AuthUser, rows: CreateUserDto[]) {
    const created: Array<{ email: string; profileId: string }> = [];
    const failed: Array<{ email: string; reason: string }> = [];

    for (const row of rows) {
      try {
        const result = await this.usersCreate.create(actor, row);
        created.push({ email: row.email, profileId: result.profileId });
      } catch (err) {
        failed.push({ email: row.email, reason: (err as Error)?.message ?? 'Unknown error' });
      }
    }

    return { created, failed, total: rows.length };
  }
}
