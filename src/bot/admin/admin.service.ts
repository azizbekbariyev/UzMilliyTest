import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Context } from "telegraf";
import { Test } from "../models/test.model";
import { Repository } from "typeorm";
import { Science } from "../models/science";
import { MyContext } from "src/types/context.type";
import { User } from "../models/user.model";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Science)
    private readonly scienceRepository: Repository<Science>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async onlineTests(ctx: Context) {
    const tests = await this.testRepository.find({
      where: {
        is_it_over: false,
      },
    });
    if (tests.length == 0) {
      await ctx.reply("Testlar mavjud emas");
    } else {
      await ctx.replyWithHTML(`Testlar`, {
        reply_markup: {
          inline_keyboard: tests.map((test) => {
            return [
              {
                text: test.test_id,
                callback_data: `test_code_${test.test_id}`,
              },
            ];
          }),
        },
      });
    }
  }

  async addTest(ctx: Context) {
    const science = await this.scienceRepository.find();
    if (science.length == 0) {
      await ctx.replyWithHTML("Avval fan qo'shing", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Fan qo'shish",
                callback_data: "add_science",
              },
            ],
          ],
        },
      });
    } else {
      const admin = await this.userRepository.findOne({
        where: {
          id_telegram: ctx.from!.id,
        },
      });
      const webAppUrl = `https://bot.shamseducation.uz/admin/test?token=${admin?.token}`;
      ctx.replyWithHTML(
        `Testlarni javoblarini quyida app orqali kirgizsangiz bo'ladi`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "App",
                  web_app: {
                    url: webAppUrl,
                  },
                },
              ],
            ],
          },
        }
      );
    }
  }

  async addScience(ctx: MyContext) {
    ctx.session.science = true;
    await ctx.reply(`Fan qo'shish uchun nomini kiriting:`);
  }
}
