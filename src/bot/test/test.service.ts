import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MyContext } from "src/types/context.type";
import { Context } from "telegraf";
import { Repository } from "typeorm";
import { Test } from "../models/test.model";
import { join } from "path";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf } from "telegraf";
import { BOT_NAME } from "src/app.constants";

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf
  ) {}

  async science(ctx: Context) {
    await ctx.reply("Test davom etyapti", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Test to'xtatish",
              callback_data: `end_test_${ctx.callbackQuery!["data"].split("_")[2]}`,
            },
          ],
        ],
      },
    });
  }

  addCountTest(ctx: MyContext) {
    ctx.session.scienceText = ctx.callbackQuery!["data"].split("_")[1];
    ctx.session.countTest = true;
    ctx.reply(
      "Sizning testingiz kodi yozing\n\nM18"
    );
  }

  async endTest(ctx: Context) {
    const testId = ctx.callbackQuery!["data"].split("_")[2];
    const test = await this.testRepository.findOne({
      where: {
        test_id: testId,
      },
    });
    if (test) {
      await this.testRepository.update(
        {
          test_id: testId,
        },
        {
          is_it_over: true,
        }
      );
    }
    const filePath = join(process.cwd(), "uploads", `${testId}.xlsx`);
    await ctx.replyWithDocument({
      source: filePath,
      filename: `${testId}.xlsx`,
    });
  }

  async sendTestUser(chatId:number, message:string){
    await this.bot.telegram.sendMessage(chatId, message)
  }
}
