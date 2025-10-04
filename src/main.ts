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
      "http://localhost:3010",
      "http://localhost:3000",
      "http://localhost:4173",
      "https://web.telegram.org",
      "https://telegram.org",
    ];

    app.enableCors({
      origin: (origin, callback) => {
        // Origin bo'lmasa (masalan, Postman yoki server-side request)
        if (!origin) {
          console.log('⚠️ No origin - allowing request');
          return callback(null, true);
        }
        
        // Originni tekshirish
        if (allowedOrigins.includes(origin)) {
          console.log('✅ CORS allowed:', origin);
          callback(null, true);
        } else {
          console.log('❌ CORS blocked:', origin);
          // MUHIM: Error o'rniga false qaytarish
          callback(null, false); // ← BU JOYNI O'ZGARTIRDIK
        }
      },
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
      optionsSuccessStatus: 204
    });

    app.use(cookieParser());
    app.setGlobalPrefix("api");
    
    await app.listen(PORT, () => {
      console.log(`🚀 Server started at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.log('❌ Server start error:', error);
  }
}

start();