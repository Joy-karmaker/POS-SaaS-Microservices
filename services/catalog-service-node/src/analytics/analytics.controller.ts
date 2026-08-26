import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: any) {
    return this.analyticsService.getAnalyticsSummary(Number(user.tenant_id));
  }

  @Get('forecast')
  getForecast(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getForecastList(Number(user.tenant_id), p, l);
  }

  @Post('seed-sales')
  seedSales(@CurrentUser() user: any, @Body('count') count?: number) {
    const recordCount = count === undefined ? 1000 : Number(count);
    if (!Number.isInteger(recordCount) || recordCount < 1 || recordCount > 10_000) {
      throw new BadRequestException('count must be an integer between 1 and 10000');
    }


    return this.analyticsService.seedSimulationSales(Number(user.tenant_id), recordCount);
  }

  @Post('recalculate')
  recalculate(@CurrentUser() user: any) {
    return this.analyticsService.recalculateAllProductsForecast(Number(user.tenant_id));
  }
}
