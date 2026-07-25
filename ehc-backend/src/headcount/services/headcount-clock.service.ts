import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import type { ServiceState } from '../headcount.util';

@Injectable()
export class HeadcountClockService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Current time, honouring ATTENDANCE_TEST_NOW so headcount + check-in share a clock. */
  getNow(): Date {
    const override = this.config.get('ATTENDANCE_TEST_NOW', { infer: true });
    return override?.trim() ? new Date(override.trim()) : new Date();
  }

  /**
   * Derive a service's lifecycle state. A headcount may only be recorded once the
   * service is LIVE or ENDED, never while still SCHEDULED. Signals, in order:
   * an explicit close (ENDED), an open flag or ATTENDANCE_FORCE_OPEN (LIVE), or
   * the clock passing openAt / scheduledAt (started).
   */
  serviceState(svc: { scheduledAt: Date; openAt: Date | null; closeAt: Date | null; isOpen: boolean }): ServiceState {
    const now = this.getNow();
    if (svc.closeAt && now >= svc.closeAt) return 'ENDED';
    if (svc.isOpen) return 'LIVE';
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true }) === true) return 'LIVE';
    const started = (svc.openAt && now >= svc.openAt) || now >= svc.scheduledAt;
    return started ? 'LIVE' : 'SCHEDULED';
  }
}
