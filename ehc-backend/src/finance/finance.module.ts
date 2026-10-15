import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceRolesGuard } from './finance-roles.guard';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, FinanceRolesGuard],
})
export class FinanceModule {}
