import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TestAnswerController } from "./test_answer.controller";
import { TestAnswerService } from "./test_answer.service";
import { TestAnswer } from "src/bot/models/test_answer";
import { TestAnswerRepository } from "./test_answer.repository";
import { Test } from "src/bot/models/test.model";


@Module({
    imports: [TypeOrmModule.forFeature([TestAnswer , Test])],
    controllers: [TestAnswerController],
    providers: [TestAnswerService, TestAnswerRepository],
})

export class TestAnswerModule {}