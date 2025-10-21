import { Action, Ctx, Update } from "nestjs-telegraf";
import { TestService } from "./test.service";
import { Context } from "telegraf";
import { MyContext } from "src/types/context.type";
import { BotService } from "../bot.service";

@Update()
export class TestUpdate {
  constructor(private readonly testService: TestService, private readonly botService: BotService) {}

  @Action(/test_code_(.+)/)
  async science(@Ctx() ctx: Context) {
    await this.testService.science(ctx);
  }

  @Action(/^science_\d+$/)
  async addCountTest(@Ctx() ctx: MyContext) {
    return this.testService.addCountTest(ctx);
  }

  @Action(/end_test_(.+)/)
  async endTest(@Ctx() ctx: MyContext) {
    return this.testService.endTest(ctx);
  }

  @Action(/view_test_answers/)
  async viewTest(@Ctx() ctx: MyContext) {
    return this.testService.viewTest(ctx);
  }

  @Action(/test_view_answer_(.+)/)
  async viewTestAnswer(@Ctx() ctx: Context) {
    return this.testService.viewTestAnswer(ctx);
  }

  @Action("back_to_menu")
  async backToMenu(@Ctx() ctx: MyContext) {
    await this.botService.start(ctx);
  }
}
