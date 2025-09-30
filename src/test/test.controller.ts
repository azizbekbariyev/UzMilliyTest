import { Controller, Get, Param } from '@nestjs/common';
import { TestService } from './test.service';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('test-science/:test_id')
  async findOneTestWithScience(@Param('test_id') test_id: string) {
    return this.testService.findOneTestWithScience(test_id);
  }
}
