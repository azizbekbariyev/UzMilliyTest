import { Action, Ctx, On, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { AdminService } from "./admin.service";
import { MyContext } from "src/types/context.type";
@Update()
export class AdminUpdate {
  constructor(
    private readonly adminService: AdminService
  ) {}

  @Action("online_tests")
  async onlineTests(@Ctx() ctx: Context) {
    return this.adminService.onlineTests(ctx);
  }

  @Action("add_test")
  async addTest(@Ctx() ctx: Context) {
    return this.adminService.addTest(ctx);
  }

  @Action("add_science")
  async addScience(@Ctx() ctx: MyContext) {
    return this.adminService.addScience(ctx);
  }
}
