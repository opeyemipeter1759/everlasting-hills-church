import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsRecipientsService } from './emails-recipients.service';


@Module({
  controllers: [EmailsController],
  providers: [EmailsService, EmailsRecipientsService],
  exports: [EmailsService],
})
export class EmailsModule {}
