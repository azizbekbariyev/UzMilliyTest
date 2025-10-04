import { Injectable } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf, Context } from "telegraf";
import { BOT_NAME } from "../app.constants";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./models/user.model";
import { Repository } from "typeorm";
import { MyContext } from "src/types/context.type";
import { Science } from "./models/science";
import { TestAnswer } from "./models/test_answer";
import { Test } from "./models/test.model";
import * as ExcelJS from "exceljs";
import * as path from "path";
import { randomBytes } from "crypto";

@Injectable()
export class BotService {
  constructor(
    @InjectBot(BOT_NAME) private readonly bot: Telegraf,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Science)
    private readonly scienceRepository: Repository<Science>,
    @InjectRepository(TestAnswer)
    private readonly testAnswerRepository: Repository<TestAnswer>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>
  ) {}

  generateToken(length = 32) {
    return randomBytes(length).toString("hex");
  }

  async start(ctx: MyContext) {
    const admin = process.env.ADMIN;
    ctx.session.science = false;
    ctx.session.countTest = false;
    ctx.session.openTest = false;
    if (ctx.from?.id == admin) {
      const adminRepo = await this.userRepository.findOne({
        where: {
          id_telegram: admin,
        },
      });
      if (!adminRepo) {
        ctx.session.name = true;
        await ctx.reply("Iltimos, ismingiz va familiyangizni kiriting:");
      } else {
        await ctx.replyWithHTML(`Menuni tanlang:`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Online testlarni ko'rish",
                  callback_data: "online_tests",
                },
              ],
              [
                {
                  text: "Test qo'shish",
                  callback_data: "add_test",
                },
                {
                  text: "Fan qo'shish",
                  callback_data: "add_science",
                },
              ],
            ],
          },
        });
      }
    } else {
      const userId = ctx.from!.id;
      const channel = "@azizbek_bariyev_life";
      try {
        const member = await this.bot.telegram.getChatMember(channel, userId);
        if (["member", "administrator", "creator"].includes(member.status)) {
          const user = await this.userRepository.findOne({
            where: {
              id_telegram: userId,
            },
          });
          if (!user) {
            await ctx.reply("Iltimos, ismingiz va familiyangizni kiriting:");
          } else {
            const token = this.generateToken();
            await this.userRepository.update(
              { id_telegram: userId },
              { token: token }
            );
            const webAppUrl = `https://uz-milliy-test.uz/?token=${token}`;
            //http://localhost:5173/?token=06cbc2e47cab18df94f0189bdef1f986767bd31ef47e01ffcad55e30559341b9
            await ctx.replyWithHTML(
              `Assalomu alaykum! 👋 ${ctx.from?.first_name}\n📋 Test ishlash uchun pastdagi tugmani bosing:`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "Testni boshlash",
                        web_app: {
                          url: webAppUrl,
                        },
                      },
                    ],
                    [
                      {
                        text: "Natijani ko'rish",
                        callback_data: "result",
                      },
                      {
                        text: "Test tahlili",
                        callback_data: "analysis",
                      },
                    ],
                    [
                      {
                        text: "Ismingizni o'zgartirish",
                        callback_data: "change_name",
                      },
                    ],
                  ],
                },
              }
            );
          }
        } else {
          await ctx.replyWithHTML(
            `❗️ Botdan foydalanish uchun quydagi kanalga a'zo bo'ling:`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔗 Kanalga obuna bo'ling",
                      url: "https://t.me/azizbek_bariyev_life",
                    },
                  ],
                  [
                    {
                      text: "✅ Tekshirish",
                      callback_data: "check",
                    },
                  ],
                ],
              },
            }
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async check(ctx: Context) {
    const userId = ctx.from!.id;
    const channel = "@azizbek_bariyev_life";
    try {
      const member = await this.bot.telegram.getChatMember(channel, userId);
      if (["member", "administrator", "creator"].includes(member.status)) {
        await ctx.reply(
          "✅ Kanal ga a'zo bo'ldingiz! Endi botdan foydalanishingiz mumkin.Iltimos /start buyrug'ini bosing"
        );
      } else {
        await ctx.answerCbQuery("❗️ Siz hali kanalga obuna bo‘lmagansiz!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onText(ctx: MyContext) {
    const admin = process.env.ADMIN;
    if (ctx.from?.id == admin) {
      if(ctx.session.name){
        ctx.session.name = false;
        const user = await this.userRepository.create({
          username: ctx.message!["text"],
          id_telegram: ctx.from!.id,
          role: "admin",
        })
        await this.userRepository.save(user);
      }
      if (ctx.session.science) {
        ctx.session.scienceText = ctx.message!["text"];
        await this.scienceRepository.save({
          name: ctx.session.scienceText,
        });
        ctx.session.science = false;
        await ctx.replyWithHTML("Fan qo'shildi", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Online testlarni ko'rish",
                  callback_data: "online_tests",
                },
              ],
              [
                {
                  text: "Test qo'shish",
                  callback_data: "add_test",
                },
                {
                  text: "Fan qo'shish",
                  callback_data: "add_science",
                },
              ],
            ],
          },
        });
      } else if (ctx.session.countTest) {
        const testId = ctx.message!["text"].split(",")[0];
        const testFindId = await this.testRepository.findOne({
          where: {
            test_id: testId,
          },
        });
        if (testFindId) {
          await ctx.reply("Bunday test mavjud");
        } else {
          ctx.session.countTestText = ctx.message!["text"];
          ctx.session.openTest = true;
          ctx.session.countTest = false;
          await ctx.reply(
            "Yopiq test javoblarini quyidagicha yozing:\n\n1-B,2-C ..."
          );
        }
      } else if (ctx.session.openTest) {
        const filterTest = ctx.message!["text"].split(",");
        const filterTestCount = filterTest.length;
        const testCount = ctx.session.countTestText.split(",")[1];
        if (filterTestCount == testCount) {
          ctx.session.openTest = false;
          const science = await this.scienceRepository.findOne({
            where: {
              id: parseInt(ctx.session.scienceText),
            },
          });

          if (!science) {
            throw new Error("Science not found");
          }
          const test = await this.testRepository.save({
            test_id: ctx.session.countTestText.split(",")[0],
            is_it_over: false,
            subject_name: science!.name,
            science,
          });
          await this.testAnswerRepository.save({
            option: filterTest,
            option_code: ctx.session.countTestText.split(",")[2],
            test,
          });
          const workbook = new ExcelJS.Workbook();
          let worksheet: ExcelJS.Worksheet;
          const filePath = path.join(
            process.cwd(),
            "uploads",
            `${test.test_id}.xlsx`
          );
          worksheet = workbook.addWorksheet("Natijalar");
          worksheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Ism-Familiya", key: "name", width: 20 },
            { header: "Viloyat", key: "region", width: 20 },
            { header: "Savol-Javoblar", key: "answer", width: 20 },
          ];
          const admin = await this.userRepository.findOne({
            where:{
              id_telegram: ctx.from!.id
            }
          })
          console.log(admin)
          
          await workbook.xlsx.writeFile(filePath);
          const webAppUrl = `https://uz-milliy-test.uz/?token=${admin?.token}`
          ctx.replyWithHTML(
            `Ochiq testlarni javoblarini quyida app orqali kirgizsangiz bo'ladi`,
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
        } else {
          ctx.reply("Ochiq test javoblari to'liq kiritilmadi!");
        }
      } else {
        await ctx.replyWithHTML(`Menuni tanlang:`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Online testlarni ko'rish",
                  callback_data: "online_tests",
                },
              ],
              [
                {
                  text: "Test qo'shish",
                  callback_data: "add_test",
                },
                {
                  text: "Fan qo'shish",
                  callback_data: "add_science",
                },
              ],
            ],
          },
        });
      }
    } else {
      const user = this.userRepository.create({
        username: ctx.message!["text"],
        id_telegram: ctx.from!.id,
      });
      await this.userRepository.save(user);
      await ctx.reply("Iltimos /start buyrug'ini bosing");
    }
  }
}
