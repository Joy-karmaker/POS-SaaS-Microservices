import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMqModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
