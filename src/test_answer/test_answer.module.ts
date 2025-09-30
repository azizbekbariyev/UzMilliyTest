import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TestAnswerController } from "./test_answer.controller";
import { TestAnswerService } from "./test_answer.service";
import { TestAnswer } from "src/bot/models/test_answer";
import { TestAnswerRepository } from "./test_answer.repository";


@Module({
    imports: [TypeOrmModule.forFeature([TestAnswer])],
    controllers: [TestAnswerController],
    providers: [TestAnswerService, TestAnswerRepository],
})

export class TestAnswerModule {}