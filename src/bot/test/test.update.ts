import { Action, Ctx, Update } from "nestjs-telegraf";
import { TestService } from "./test.service";
import { Context } from "telegraf";
import { MyContext } from "src/types/context.type";

@Update()
export class TestUpdate {
  constructor(private readonly testService: TestService) {}

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
}
