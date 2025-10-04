import { BotService } from "./bot.service";
import { Action, Ctx, On, Start, Update } from "nestjs-telegraf";
import { MyContext } from "src/types/context.type";
import { Context } from "telegraf";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async start(@Ctx() ctx: MyContext) {
    await this.botService.start(ctx);
  }

  @On("text")
  async onText(@Ctx() ctx: MyContext) {
    return this.botService.onText(ctx);
  }

  @Action("check")
  async check(@Ctx() ctx: Context) {
    return this.botService.check(ctx);
  }
}
