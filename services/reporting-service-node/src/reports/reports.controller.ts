import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-sales')
  dailySales(@CurrentUser() user: any, @Query('date') date?: string) {
    return this.reportsService.getDailySales(user.tenant_id, date);
  }

  @Get('summary')
  summary(@CurrentUser() user: any) {
    return this.reportsService.getSummary(user.tenant_id);
  }
}
