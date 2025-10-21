import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TestAnswerController } from "./test_answer.controller";
import { TestAnswerService } from "./test_answer.service";
import { TestAnswer } from "src/bot/models/test_answer";
import { TestAnswerRepository } from "./test_answer.repository";
import { Test } from "src/bot/models/test.model";
import { User } from "src/bot/models/user.model";
import { BotModule } from "src/bot/bot.module";
import { UserTestCheck } from "src/bot/models/userTestCheck";
import { Science } from "src/bot/models/science";


@Module({
    imports: [TypeOrmModule.forFeature([TestAnswer , Test, User, UserTestCheck, Science]), BotModule],
    controllers: [TestAnswerController],
    providers: [TestAnswerService, TestAnswerRepository],
})

export class TestAnswerModule {}