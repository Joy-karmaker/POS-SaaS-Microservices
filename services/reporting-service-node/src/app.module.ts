import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ReportsModule } from './reports/reports.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [ReportsModule, RabbitMqModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
