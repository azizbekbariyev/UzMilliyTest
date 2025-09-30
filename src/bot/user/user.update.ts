import { Action, Ctx, Hears, On, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { UserService } from "./user.service";

@Update()
export class UserUpdate {
  constructor(private readonly userService: UserService) {}

  async onText(@Ctx() ctx: Context) {
    return this.userService.onText(ctx);
  }
}
