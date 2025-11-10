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
    try {
      const testId = ctx.callbackQuery!["data"].split("_")[2];
      const test = await this.testRepository.findOne({
        where: { test_id: testId },
      });

      if (!test) {
        return ctx.reply("❌ Bunday test topilmadi.");
      }

      // Testni yakunlangan deb belgilaymiz
      await this.testRepository.update(
        { test_id: testId },
        { is_it_over: true }
      );

      const testDir = join(process.cwd(), "uploads", testId);
      if (!fs.existsSync(testDir)) {
        return ctx.reply("❌ Test papkasi topilmadi.");
      }

      const zipPath = join(process.cwd(), "uploads", `${testId}.zip`);

      // Zip fayl yaratamiz
      const zip = new AdmZip();
      zip.addLocalFolder(testDir);
      zip.writeZip(zipPath);

      // Fayl hajmini tekshiramiz
      const stats = fs.statSync(zipPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 48) {
        // Juda katta bo‘lsa — link yuborish
        const publicUrl = `https://bot.shamseducation.uz/api/test/download/${testId}`;
        await ctx.reply(
          `⚠️ Zip fayl hajmi ${fileSizeMB.toFixed(
            2
          )} MB bo‘lgani uchun u to‘g‘ridan-to‘g‘ri Telegram orqali yuborilmadi.\n\n🔗 Yuklab olish: ${publicUrl}`
        );
      } else {
        // 50 MB dan kichik bo‘lsa — Telegram orqali yuborish
        await ctx.replyWithDocument({
          source: zipPath,
          filename: `${testId}.zip`,
        });
      }

      // Tozalash (2 kundan keyin)
      setTimeout(() => {
        try {
          fs.rmSync(testDir, { recursive: true, force: true });
          fs.unlinkSync(zipPath);
          console.log(`🧹 ${testId} fayllari o‘chirildi`);
        } catch (err) {
          console.error("Faylni o‘chirishda xatolik:", err);
        }
      }, 1000 * 60 * 60 * 24 * 2); // 2 kun

      return ctx.reply("✅ Test yakunlandi!");
    } catch (err) {
      console.error("❌ endTest xatolik:", err);
      return ctx.reply("❌ Testni yakunlashda xatolik yuz berdi.");
    }
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
