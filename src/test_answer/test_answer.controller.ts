import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TestAnswerService } from "./test_answer.service";
import { CheckTestAnswerDto } from "./dto/check-test-answer.dto";

@Controller("test-answer")
export class TestAnswerController {
  constructor(private readonly testAnswerService: TestAnswerService) {}

  @Get('test-answer-test/:test_id')
  getTestAnswerWithTestId(@Param('test_id') test_id: string) {
    return this.testAnswerService.getTestAnswerWithTestId(test_id)
  }

  @Post("add-test-answer/:test_id")
  async addTestAnswer(
    @Param("test_id") test_id: string,
    @Body() answersArray: string[]
  ) {
    return this.testAnswerService.addTestAnswer(test_id, answersArray);
  }

  @Post("check-test-answer/:test_id")
  async checkTestAnswer(@Param("test_id") test_id: string, @Body() body :CheckTestAnswerDto ) {
    console.log(body)
    return this.testAnswerService.checkTestAnswer(test_id, body);
  }
}
