import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const allowedOrigins = [
      "https://uz-milliy-front.vercel.app",
      "http://localhost:5173",
      "http://localhost:3010",  // ← QO'SHDIM
      "http://13.127.10.10:3010", // ← QO'SHDIM (backend IP)
      "https://web.telegram.org",
      "https://telegram.org",
    ];

    app.enableCors({
      origin: (origin, callback) => {
        console.log('🔍 So\'rov kelgan origin:', origin);
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('❌ CORS bloklandi:', origin);
          callback(new Error("CORS bloklandi!"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "telegram-init-data",
      ],
    });

    // cookieParser ni parametrsiz chaqiring
    app.use(cookieParser());

    app.setGlobalPrefix("api");

    await app.listen(PORT, () => {
      console.log(`🚀 Server started at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.log(error);
  }
}
start();