import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const allowedOrigins = [
      "https://bot.shamseducation.uz", // slash yo'q
      "https://bot.shamseducation.uz/", // slash bor
      "http://localhost:5173", // development uchun
      "http://localhost:3000",
    ];

    app.enableCors({
      origin: true,
      // (origin, callback) => {
      //   if (!origin || allowedOrigins.includes(origin)) {
      //     callback(null, true);
      //   } else {
      //     console.log("❌ CORS blocked:", origin);
      //     callback(new Error("CORS blocked!"), false);
      //   }
      // },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "telegram-init-data",
        "cache-control",
      ],
      exposedHeaders: ["set-cookie"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.use(cookieParser());
    app.setGlobalPrefix("api");

    await app.listen(PORT, () => {
      console.log(`🚀 Server started at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.log("❌ Server start error:", error);
  }
}
start();
