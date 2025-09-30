import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TelegrafModule } from "nestjs-telegraf";
import { BOT_NAME } from "./app.constants";
import { BotModule } from "./bot/bot.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUpdate } from "./bot/admin/admin.update";
import { UserUpdate } from "./bot/user/user.update";
import { session } from 'telegraf';
import { TestModule } from './test/test.module';
import { TestAnswerModule } from "./test_answer/test_answer.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),

    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN!,
        middlewares: [session()],
        include: [BotModule, AdminUpdate, UserUpdate],
      }),
    }),

    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DB,
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
      dropSchema: false,
    }),
    BotModule,
    TestModule,
    TestAnswerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
