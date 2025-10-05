import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Context } from "telegraf";
import { Test } from "../models/test.model";
import { Repository } from "typeorm";
import { Science } from "../models/science";
import { MyContext } from "src/types/context.type";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Science)
    private readonly scienceRepository: Repository<Science>
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
    if(science.length == 0){
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
      })
    }else{
      await ctx.replyWithHTML(`Test qo'shish uchun fanni tanlang:`, {
      reply_markup: {
        inline_keyboard: science.map((item) => {
          return [
            {
              text: item.name,
              callback_data: `science_${item.id}`,
            },
          ];
        }),
      },
    });
    }
  }

  async addScience(ctx: MyContext) {
    ctx.session.science = true
    await ctx.reply(`Fan qo'shish uchun nomini kiriting:`);
  }
}
