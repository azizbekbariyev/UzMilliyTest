import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Test } from "src/bot/models/test.model";
import { TestAnswer } from "src/bot/models/test_answer";
import { Repository } from "typeorm";
import { TestAnswerRepository } from "./test_answer.repository";
import { CheckTestAnswerDto } from "./dto/check-test-answer.dto";
import * as fs from "fs";
import * as path from "path";
import { join } from "path";
import * as ExcelJS from "exceljs";
import { User } from "src/bot/models/user.model";
import { TestService } from "src/bot/test/test.service";
import { UserTestCheck } from "src/bot/models/userTestCheck";
import { Request } from "express";
import { AddTestAnswer } from "src/types/context.type";
import { Science } from "src/bot/models/science";

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
    private readonly userTestCheckRepository: Repository<UserTestCheck>,
    @InjectRepository(Science)
    private readonly scienceRepository: Repository<Science>
  ) {}

  async getTestAnswerWithTestId(test_id: string) {
    const testAnswer =
      await this.testAnswerRepo.getTestAnswerWithTestId(test_id);
    return testAnswer.map((testAns)=>{
      return {
        id: testAns.id,
        test_number: testAns.test_number,
        if_test: testAns.if_test,
        option_code: testAns.option_code,
      }
    })
  }

  async addTestAnswer(test_id: string, answersArray: AddTestAnswer) {
    const uploadsDir = join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${test_id}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    // Fayl mavjudligini tekshiramiz
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
      const existingSheet = workbook.getWorksheet("Natijalar");
      worksheet = existingSheet
        ? existingSheet
        : workbook.addWorksheet("Natijalar");
    } else {
      worksheet = workbook.addWorksheet("Natijalar");
    }

    // Testlar sonini hisoblaymiz
    const yopiq = Object.keys(answersArray.yopiq_testlar || {});
    const ochiq = Object.keys(answersArray.ochiq_testlar || {});
    const totalTests = yopiq.length + ochiq.length;

    // Ustunlarni yaratamiz
    const baseColumns: Partial<ExcelJS.Column>[] = [
      { header: "ID", key: "id", width: 10 },
      { header: "Ism-Familiya", key: "name", width: 20 },
      { header: "Viloyat", key: "region", width: 20 },
    ];
    for (let i = 1; i <= totalTests; i++) {
      baseColumns.push({ header: `T${i}`, key: `t${i}`, width: 10 });
    }
    worksheet.columns = baseColumns as ExcelJS.Column[];

    await workbook.xlsx.writeFile(filePath);

    const test = this.testRepository.create({
      test_id: test_id,
      subject_name: answersArray.subject.value,
      is_it_over: false,
      science: { id: answersArray.subject.id },
      open_test_sequential: answersArray.open_test_sequential,
    });
    await this.testRepository.save(test);

    if (answersArray.yopiq_testlar.length) {
      console.log("shu yerda1 ")
      return { message: "success" };
    } else {
      for (const [key, value] of Object.entries(answersArray.yopiq_testlar)) {
        const testAnswer = this.testAnswerRepository.create({
          if_test: true,
          option_code: value.test_variants.join(","),
          option: value.correct_variant,
          test: {
            id: test.id,
          },
          test_number:Number(key),
        });
        await this.testAnswerRepository.save(testAnswer);
      }
    }

    if (answersArray.ochiq_testlar.length) {
      console.log("shu yerda2 ")
      return { message: "success" };
    } else {
      for (const [key, value] of Object.entries(answersArray.ochiq_testlar)) {
        const openAnswer = this.testAnswerRepository.create({
          if_test: false,
          option_code: "0",
          option: value,
          test: { id: test.id },
          test_number:Number(key),
        });
        await this.testAnswerRepository.save(openAnswer);
      }
    }
    return { message: "success" };
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
        for (let i = 0; i < ans.option_code; i++) {
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
            for (
              let i = existingTestCount + 1;
              i <= Object.keys(results).length;
              i++
            ) {
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

    const message = `📊 Test natijalaringiz yuborildi 📊\n\nNatijalarni quyidagi kanal orqali ko'rishingiz mumkin`;
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

  getScience() {
    return this.scienceRepository.find();
  }

  async   findTest(testId: string) {
    const test = await this.testRepository.findOne({
      where: { test_id: testId },
    });
    if (test) {
      return true;
    }
    return false;
  }
}
