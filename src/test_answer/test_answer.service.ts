import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Test } from "src/bot/models/test.model";
import { TestAnswer } from "src/bot/models/test_answer";
import { Repository } from "typeorm";
import { TestAnswerRepository } from "./test_answer.repository";
import { CheckTestAnswerDto } from "./dto/check-test-answer.dto";
import * as fs from "fs";
import * as path from "path";
import * as ExcelJS from "exceljs";
import { User } from "src/bot/models/user.model";
import { TestService } from "src/bot/test/test.service";
import { UserTestCheck } from "src/bot/models/userTestCheck";
import { Request } from "express";

@Injectable()
export class TestAnswerService {
  constructor(
    @InjectRepository(TestAnswer)
    private readonly testAnswerRepository: Repository<TestAnswer>,
    private readonly testAnswerRepo: TestAnswerRepository,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly testService: TestService,
    @InjectRepository(UserTestCheck)
    private readonly userTestCheckRepository: Repository<UserTestCheck>
  ) {}

  async getTestAnswerWithTestId(test_id: string) {
    const testAnswer =
      await this.testAnswerRepo.getTestAnswerWithTestId(test_id);
    return testAnswer;
  }

  async addTestAnswer(test_id: string, answersArray: string[]) {
    const filePath = path.join(process.cwd(), "uploads", `${test_id}.xlsx`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ Fayl topilmadi: ${filePath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    let worksheet = workbook.getWorksheet("Natijalar");
    if (!worksheet) worksheet = workbook.addWorksheet("Natijalar");

    // ✅ Mavjud maksimal test raqamini topish
    let maxTestNumber = 0;
    const headerRow = worksheet.getRow(1);
    
    headerRow.eachCell((cell) => {
      const value = cell.value?.toString() || "";
      const match = value.match(/^T(\d+)$/); // T1, T2, T3... formatini topish
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxTestNumber) {
          maxTestNumber = num;
        }
      }
    });

    // ✅ Yangi ustunlarni qo'shish
    const lastColIndex = worksheet.columnCount;
    let nextTNumber = maxTestNumber; // Mavjud maksimal raqamdan boshlaymiz

    for (let i = 0; i < answersArray.length; i++) {
      nextTNumber++;
      const col = worksheet.getColumn(lastColIndex + i + 1);
      col.header = `T${nextTNumber}`;
      col.width = 10;
    }

    // ✅ ID ustuni ichida test_id ni aniq topish
    const idValues = worksheet.getColumn(1).values.slice(1);
    const rowIndex = idValues.findIndex((v) => v === test_id);

    const row = worksheet.getRow(rowIndex + 1);

    let colIndex = lastColIndex + 1;
    for (const value of answersArray) {
      row.getCell(colIndex++).value = value;
    }
    row.commit();

    await workbook.xlsx.writeFile(filePath);

    // 🔹 Ma'lumotlarni DB ga yozish
    const answersToSave: Partial<TestAnswer>[] = [];
    const test = await this.testRepository.findOne({ where: { test_id } });

    for (const answer of answersArray) {
      answersToSave.push({
        option: answer,
        option_code: "0",
        if_test: false,
        test: test as Test,
      });
    }

    return this.testAnswerRepository.save(answersToSave);
  }

  async checkTestAnswer(test_id: string, body: CheckTestAnswerDto) {
    const user = await this.userRepository.findOne({
      where: {
        token: body.token,
      },
    });

    let results: Record<string, number> = {};
    const testAnswer =
      await this.testAnswerRepo.getTestAnswerWithTestId(test_id);

    let countTest = 1;

    for (const ans of testAnswer) {
      if (ans.if_test) {
        for (let i = 0; i < 35; i++) {
          const key = `${ans.id}-${i}`;
          const userAns = body.answers[key];
          if (userAns) {
            const correctOptions = ans.option
              .replace(/[{}"]/g, "")
              .split(",")
              .map((s: string) => s.split("-")[1].trim());
              
            const correctValue = correctOptions[i];
            results[countTest] = userAns.value === correctValue ? 1 : 0;
          }
          countTest++;
        }
      } else {
        const userAns = body.answers[ans.id];

        if (userAns) {
          results[`${countTest}`] = userAns.value === ans.option ? 1 : 0;
        } else {
          results[`${countTest}`] = 0;
        }
        countTest++;
      }
    }
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${body.test[0].test_id}.xlsx`);

    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    if (fs.existsSync(filePath)) {
      try {
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet("Natijalar")!;

        if (!worksheet) {
          // ✅ Yangi worksheet yaratish
          worksheet = workbook.addWorksheet("Natijalar");
          const baseColumns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Ism-Familiya", key: "name", width: 20 },
            { header: "Viloyat", key: "region", width: 20 },
          ];
          for (let i = 1; i <= Object.keys(results).length; i++) {
            baseColumns.push({ header: `T${i}`, key: `t${i}`, width: 10 });
          }
          worksheet.columns = baseColumns;
        } else {
          // ✅ Mavjud worksheet - ustunlar sonini tekshirish
          const currentColCount = worksheet.columnCount;
          const requiredColCount = 3 + Object.keys(results).length; // ID, Name, Region + testlar
          
          // ✅ Agar yetarli ustun bo'lmasa, qo'shamiz
          if (currentColCount < requiredColCount) {
            const existingTestCount = currentColCount - 3;
            for (let i = existingTestCount + 1; i <= Object.keys(results).length; i++) {
              const col = worksheet.getColumn(3 + i);
              col.header = `T${i}`;
              col.width = 10;
            }
          }
        }
      } catch (error) {
        // ✅ Xatolik bo'lsa, yangi worksheet yaratamiz
        worksheet = workbook.addWorksheet("Natijalar");
        const baseColumns = [
          { header: "ID", key: "id", width: 10 },
          { header: "Ism-Familiya", key: "name", width: 20 },
          { header: "Viloyat", key: "region", width: 20 },
        ];
        for (let i = 1; i <= Object.keys(results).length; i++) {
          baseColumns.push({ header: `T${i}`, key: `t${i}`, width: 10 });
        }
        worksheet.columns = baseColumns;
      }
    } else {
      // ✅ Fayl yo'q bo'lsa, yangi yaratamiz
      worksheet = workbook.addWorksheet("Natijalar");
      const baseColumns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Ism-Familiya", key: "name", width: 20 },
        { header: "Viloyat", key: "region", width: 20 },
      ];
      for (let i = 1; i <= Object.keys(results).length; i++) {
        baseColumns.push({ header: `T${i}`, key: `t${i}`, width: 10 });
      }
      worksheet.columns = baseColumns;
    }

    // ✅ Yangi qator qo'shish
    const resultValues = Object.values(results);
    const newRow = worksheet.addRow([
      body.test[0].test_id,
      `${body.testData.firstName} ${body.testData.lastName}`,
      body.testData.region,
      ...resultValues,
    ]);
    newRow.commit();

    // ✅ Faylni saqlash
    await workbook.xlsx.writeFile(filePath);

    const test = await this.testRepository.findOne({
      where: {
        test_id: body.test[0].test_id,
      },
    });
    if (!test) {
      return;
    }

    const userTestCheckCreate = this.userTestCheckRepository.create({
      user: user as User,
      test: test as Test,
    });

    await this.userTestCheckRepository.save(userTestCheckCreate);
    
    const chatId = user?.id_telegram;
    const totalQuestions = Object.keys(results).length;
    const correct = Object.values(results).filter((v) => v === 1).length;
    const incorrect = Object.values(results).filter((v) => v === 0).length;

    const message = `📊 *Test natijalari* 📊

🧾 *Test kodi:* ${body.test[0].test_id}
❓ *Savollar soni:* ${totalQuestions}

✅ *To'g'ri javoblar:* ${correct}
❌ *Xato javoblar:* ${incorrect}
`;
    this.testService.sendTestUser(chatId!, message);
    return results;
  }

  async testCheckOneSubmit(req: Request, test_id: string) {
    const user_token = (req.headers as any).authorization?.replace(
      "Bearer ",
      ""
    );
    const user = await this.userTestCheckRepository.find({
      where: {
        user: {
          token: user_token,
        },
        test: {
          test_id: test_id,
        },
      },
    });
    if (user.length > 0) {
      return true;
    } else {
      return false;
    }
  }
}
