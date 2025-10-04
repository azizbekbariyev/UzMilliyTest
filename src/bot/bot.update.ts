import { BotService } from "./bot.service";
import { Action, Ctx, On, Start, Update } from "nestjs-telegraf";
import { MyContext } from "src/types/context.type";
import { Context } from "telegraf";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async start(@Ctx() ctx: MyContext) {
    ctx.replyWithHTML(`Assalomu alaykum, ${ctx.from?.first_name}!`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Online testlarni ko'rish",
              web_app: {
                url: 'https://uz-milliy-test.uz',
              }
            },
          ],
        ],
      },
    })
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
