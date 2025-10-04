import { Injectable } from "@nestjs/common";
import { Context, Markup } from "telegraf";
import { User } from "../models/user.model";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}
  async onText(ctx: Context) {
    const length = 32;
    const token = randomBytes(length).toString("hex");
    const user = this.userRepository.create({
      username: ctx.message!["text"],
      id_telegram: ctx.from!.id,
      token,
    });
    await this.userRepository.save(user);

    await ctx.replyWithHTML(
      `Assalomu alaykum! 👋 Azizbek Bariyev\n📋 Test ishlash uchun pastdagi tugmani bosing:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
                {
                    text: "Testni boshlash",
                    web_app: { url: `uz-milliy-test.uz/test/?token=${token}` }
                }
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
}
