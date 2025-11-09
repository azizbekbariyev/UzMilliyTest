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
    return testAnswer.map((testAns) => {
      return {
        id: testAns.id,
        test_number: testAns.test_number,
        if_test: testAns.if_test,
        option_code: testAns.option_code,
      };
    });
  }

  async addTestAnswer(test_id: string, answersArray: AddTestAnswer) {
    const uploadsDir = join(process.cwd(), "uploads", `${test_id}`);
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${test_id}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
      const existingSheet = workbook.getWorksheet("Natijalar");
      worksheet = existingSheet
        ? existingSheet
        : workbook.addWorksheet("Natijalar");
    } else {
      worksheet = workbook.addWorksheet("Natijalar");
    }

    const yopiq = Object.keys(answersArray.yopiq_testlar || {});
    const ochiq = Object.keys(answersArray.ochiq_testlar || {});
    const totalTests = yopiq.length + ochiq.length;

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
      photo: answersArray.photo,
    });
    await this.testRepository.save(test);

    // ✅ Yopiq testlar
    if (
      !answersArray.yopiq_testlar ||
      Object.keys(answersArray.yopiq_testlar).length === 0
    ) {
    } else {
      for (const [key, value] of Object.entries(answersArray.yopiq_testlar)) {
        const testAnswer = this.testAnswerRepository.create({
          if_test: true,
          option_code: value.test_variants.join(","),
          option: value.correct_variant,
          test: { id: test.id },
          test_number: Number(key),
        });
        await this.testAnswerRepository.save(testAnswer);
      }
    }

    // ✅ Ochiq testlar - test_number ni string sifatida saqlash
    if (
      !answersArray.ochiq_testlar ||
      Object.keys(answersArray.ochiq_testlar).length === 0
    ) {
    } else {
      for (const [key, value] of Object.entries(answersArray.ochiq_testlar)) {
        const openAnswer = this.testAnswerRepository.create({
          if_test: false,
          option_code: "0",
          option: value,
          test: { id: test.id },
          test_number_string: key, // ✅ Yangi maydon: "36-a", "36-b" yoki "36"
          test_number: Number(key.split("-")[0]), // ✅ Eski maydon: faqat raqam qismi
        });
        await this.testAnswerRepository.save(openAnswer);
      }
    }

    return { message: "success" };
  }

  async checkTestAnswer(test_id: string, body: CheckTestAnswerDto, files: any) {
    const user = await this.userRepository.findOne({
      where: { token: body.token },
    });
    if (!user) throw new Error("User not found");

    const testAnswers =
      await this.testAnswerRepo.getTestAnswerWithTestId(test_id);

    // Test formatini aniqlash
    const isSequential = body.test?.[0]?.open_test_sequential === true;

    const results: Record<string, number> = {};

    // ✅ Javoblarni solishtirish
    for (const userAns of body.answers) {
      let correct;

      if (userAns.if_test) {
        // ✅ Yopiq test - raqam bilan solishtirish
        correct = testAnswers.find(
          (t) =>
            t.test_number === Number(userAns.test_number) && t.if_test === true
        );

        if (correct) {
          const key = String(userAns.test_number);
          results[key] = userAns.answer === correct.option ? 1 : 0;
        }
      } else {
        // ✅ Ochiq test - string bilan solishtirish
        // test_number_string: "3-a", "3-b" yoki "3"
        correct = testAnswers.find(
          (t) =>
            t.test_number_string == String(userAns.test_number) &&
            t.if_test == false
        );

        if (correct) {
          const normalize = (s: string) => s.trim().toLowerCase();
          const key = String(userAns.test_number);
          results[key] =
            normalize(userAns.answer) === normalize(correct.option) ? 1 : 0;
        } else {
          // Debug uchun
          console.log("Ochiq test topilmadi:", {
            userTestNumber: userAns.test_number,
            availableTests: testAnswers
              .filter((t) => !t.if_test)
              .map((t) => ({
                id: t.id,
                test_number_string: t.test_number_string,
                option: t.option,
              })),
          });
        }
      }
    }

    // ✅ Excel fayl
    const uploadsDir = path.join(process.cwd(), "uploads", `${test_id}`);
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${body.test[0].test_id}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    try {
      if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet("Natijalar") as ExcelJS.Worksheet;
        if (!worksheet) throw new Error();
      } else throw new Error();
    } catch {
      worksheet = workbook.addWorksheet("Natijalar");
      const baseColumns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Ism-Familiya", key: "name", width: 20 },
        { header: "Viloyat", key: "region", width: 20 },
      ];

      // Barcha testlar sonini hisoblash
      const totalTests = testAnswers.length;
      for (let i = 1; i <= totalTests; i++) {
        baseColumns.push({ header: `T${i}`, key: `t${i}`, width: 10 });
      }
      worksheet.columns = baseColumns;
    }

    const newRow = worksheet.addRow([
      body.test[0].test_id,
      `${body.testData.firstName} ${body.testData.lastName}`,
      body.testData.region,
      ...Object.values(results),
    ]);
    newRow.commit();

    await workbook.xlsx.writeFile(filePath);

    //=========================Photolarni yuklash==================================//

    if (files && files.length > 0) {
      const userFolderName = `${body.testData.firstName}_${body.testData.lastName}`;
      const baseDir = path.join(
        process.cwd(),
        "uploads",
        `${test_id}`,
        userFolderName
      );
    
      // Asosiy foydalanuvchi papkasini yaratish
      if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    
      // Savol ID lar bo'yicha guruhlash
      const filesByQuestion: { [questionId: string]: Express.Multer.File[] } = {};
    
      // Fayllarni savol ID bo'yicha guruhlash
      for (const file of files) {
        const match = file.fieldname.match(/photo_(\d+)_(\d+)/);
        if (match) {
          const questionId = match[1]; // 589, 590, etc
          const photoIndex = match[2]; // 0, 1, 2, etc
          
          if (!filesByQuestion[questionId]) {
            filesByQuestion[questionId] = [];
          }
          filesByQuestion[questionId].push(file);
        }
      }
    
      // Har bir savol uchun papka yaratish va fayllarni saqlash
      for (const [questionId, questionFiles] of Object.entries(filesByQuestion)) {
        const questionDir = path.join(baseDir, `question_${questionId}`);
        if (!fs.existsSync(questionDir)) {
          fs.mkdirSync(questionDir, { recursive: true });
        }
      
        // Fayllarni ketma-ket saqlash
        questionFiles.forEach((file, index) => {
          const fileName = `photo_${questionId}_${index}.jpg`; // photo_589_0.jpg, photo_589_1.jpg
          const filePath = path.join(questionDir, fileName);
          fs.writeFileSync(filePath, file.buffer);
        });
      
        console.log(`✅ Savol ${questionId}: ${questionFiles.length} ta rasm saqlandi`);
      }
    }

    const test = await this.testRepository.findOne({
      where: { test_id: body.test[0].test_id },
    });
    if (!test) return;

    const userTestCheck = this.userTestCheckRepository.create({
      user: user as User,
      test: test as Test,
    });
    await this.userTestCheckRepository.save(userTestCheck);

    const chatId = user.id_telegram;
    const message = `📊 Test natijalaringiz yuborildi 📊\n\nNatijalarni quyidagi kanal orqali ko'rishingiz mumkin.`;
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

  async findTest(testId: string) {
    const test = await this.testRepository.findOne({
      where: { test_id: testId },
    });
    if (test) {
      return true;
    }
    return false;
  }
}
