import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { User } from "./models/user.model";
import { AdminService } from "./admin/admin.service";
import { AdminUpdate } from "./admin/admin.update";
import { Test } from "./models/test.model";
import { Science } from "./models/science";
import { TestAnswer } from "./models/test_answer";
import { TestUpdate } from "./test/test.update";
import { TestService } from "./test/test.service";
import { UserTestCheck } from "./models/userTestCheck";

@Module({
  imports: [TypeOrmModule.forFeature([User, Test, Science, TestAnswer, UserTestCheck, Science])],
  providers: [
    BotService,
    AdminService,
    TestService,
    TestUpdate,
    AdminUpdate,
    BotUpdate,
  ],
  exports: [TestService],
})
export class BotModule {}
