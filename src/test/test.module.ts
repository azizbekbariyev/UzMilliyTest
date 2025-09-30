import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from 'src/bot/models/test.model';
import { TestRepository } from './test.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test]),
  ],
  controllers: [TestController],
  providers: [TestService, TestRepository],
})
export class TestModule {}
