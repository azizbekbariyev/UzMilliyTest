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
import { UserTestCheck } from "../models/userTestCheck";
import * as fs from "fs";
const AdmZip = require('adm-zip');

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf,
    @InjectRepository(UserTestCheck)
    private readonly testAnswerUserRepository: Repository<UserTestCheck>
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
    ctx.reply("Sizning testingiz kodi yozing\n\nSh1");
  }

  async endTest(ctx: Context) {
    const testId = ctx.callbackQuery!["data"].split("_")[2];
    const test = await this.testRepository.findOne({
      where: { test_id: testId },
    });

    if (test) {
      await this.testRepository.update(
        { test_id: testId },
        { is_it_over: true }
      );
    }

    const testDir = join(process.cwd(), "uploads", testId);

    if (!fs.existsSync(testDir)) {
      return ctx.reply("❌ Test papkasi topilmadi.");
    }

    const zipPath = join(process.cwd(), "uploads", `${testId}.zip`);
    
    const zip = new AdmZip();

    // butun papkani qo'shamiz
    zip.addLocalFolder(testDir);

    // zip faylni yozamiz
    zip.writeZip(zipPath);

    // Telegramga zipni yuboramiz
    await ctx.replyWithDocument({
      source: zipPath,
      filename: `${testId}.zip`,
    });

    setTimeout(
      () => {
        try {
          fs.rmSync(testDir, { recursive: true, force: true });
          fs.unlinkSync(zipPath);
        } catch {}
      },
      1000 * 60 * 60 * 24 * 2
    );
  }

  async sendTestUser(chatId: number, message: string) {
    const channelUrl = "https://t.me/shamseducation";
    const fullMessage = `${message}\n\n👉 <a href="${channelUrl}">Kanalga o'tish</a>`;
    await this.bot.telegram.sendMessage(chatId, fullMessage, {
      parse_mode: "HTML",
    });
  }

  async viewTest(ctx: MyContext) {
    const tests = await this.testRepository.find({
      where: { is_it_over: false },
    });
    await ctx.replyWithHTML(`📋 Testlar ro'yxati:`, {
      reply_markup: {
        inline_keyboard: [
          ...tests.map((test) => [
            {
              text: test.test_id,
              callback_data: `test_view_answer_${test.test_id}`,
            },
          ]),
          [
            {
              text: "⬅️ Orqaga",
              callback_data: "back_to_menu",
            },
          ],
        ],
      },
    });
  }

  async viewTestAnswer(ctx: Context) {
    const testId = ctx.callbackQuery!["data"].split("_")[3];
    const testUsers = await this.testAnswerUserRepository.find({
      where: { test: { test_id: testId } },
    });
    const count = testUsers.length;

    await ctx.replyWithHTML(
      `Ushbu testni <b>${count}</b> ta foydalanuvchi topshirgan ✅`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⬅️ Orqaga",
                callback_data: "view_test_answers",
              },
            ],
          ],
        },
      }
    );
  }
}
