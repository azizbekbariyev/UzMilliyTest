import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { TestAnswerService } from "./test_answer.service";
import { CheckTestAnswerDto } from "./dto/check-test-answer.dto";
import { Req } from "@nestjs/common";
import { Request } from "express";
import { AddTestAnswer } from "src/types/context.type";

@Controller("test-answer")
export class TestAnswerController {
  constructor(private readonly testAnswerService: TestAnswerService) {}

  @Get("test-answer-test/:test_id")
  getTestAnswerWithTestId(@Param("test_id") test_id: string) {
    return this.testAnswerService.getTestAnswerWithTestId(test_id);
  }

  @Post("add-test-answer/:test_id")
  addTestAnswer(
    @Param("test_id") test_id: string,
    @Body() answersArray: AddTestAnswer
  ) {
    return this.testAnswerService.addTestAnswer(test_id, answersArray);
  }

  @Post("check-test-answer/:test_id")
  checkTestAnswer(
    @Param("test_id") test_id: string,
    @Body() body: CheckTestAnswerDto
  ) {
    return this.testAnswerService.checkTestAnswer(test_id, body);
  }

  @Get("test-check-one-submit")
  testCheckOneSubmit(@Req() req: Request, @Query("test_id") test_id: string) {
    return this.testAnswerService.testCheckOneSubmit(req, test_id);
  }

  @Get("/science")
  getScience() {
    return this.testAnswerService.getScience();
  }

  @Get("/:test_id")
  findTest(@Param("test_id") testId: string) {
    return this.testAnswerService.findTest(testId);
  }
}
