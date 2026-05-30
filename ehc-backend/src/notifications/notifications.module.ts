import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

/**
 * @Global so any module can emit notification events without importing this module.
 * EventEmitterModule.forRoot is required at the app level — declared here for cohesion.
 */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: false, maxListeners: 100 })],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
