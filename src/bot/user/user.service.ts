import { Injectable } from "@nestjs/common";
import { Context, Markup } from "telegraf";
import { User } from "../models/user.model";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}
  async onText(ctx: Context) {
    const user = this.userRepository.create({
      username: ctx.message!["text"],
      id_telegram: ctx.from!.id,
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
                    web_app: { url: "https://uz-milliy-front-1.vercel.app" }
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
