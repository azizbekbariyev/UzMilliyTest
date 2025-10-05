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
    const answersToSave: Partial<TestAnswer>[] = [];
    const test = await this.testRepository.findOne({
      where: {
        test_id: test_id,
      },
    });

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
            results[key.split("-")[1]] = userAns.value === correctValue ? 1 : 0;
          }
        }
      } else {
        const userAns = body.answers[ans.id];
        if (userAns) {
          results[`${ans.id}`] = userAns.value === ans.option ? 1 : 0;
        } else {
          results[`${ans.id}`] = 0;
        }
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
          worksheet = workbook.addWorksheet("Natijalar");
          worksheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Ism-Familiya", key: "name", width: 20 },
            { header: "Region", key: "region", width: 15 },
            { header: "Savol-Javoblar", key: "answer", width: 30 },
          ];
        }
      } catch (error) {
        worksheet = workbook.addWorksheet("Natijalar");
        worksheet.columns = [
          { header: "ID", key: "id", width: 10 },
          { header: "Ism-Familiya", key: "name", width: 20 },
          { header: "Region", key: "region", width: 15 },
          { header: "Savol-Javoblar", key: "answer", width: 30 },
        ];
      }
    } else {
      worksheet = workbook.addWorksheet("Natijalar");
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Ism-Familiya", key: "name", width: 20 },
        { header: "Region", key: "region", width: 15 },
        { header: "Savol-Javoblar", key: "answer", width: 30 },
      ];
    }
    const answersString = Object.entries(results)
      .map(([key, value]) => `${key}:${value}`)
      .join(", ");
    const newRow = worksheet.addRow([
      body.test[0].test_id,
      `${body.testData.firstName} ${body.testData.lastName}`,
      body.testData.region,
      answersString,
    ]);
    await workbook.xlsx.writeFile(filePath);
    newRow.commit();
    const userTestCheckCreate = this.userTestCheckRepository.create({
      user: user as User,
      test: body.test[0],
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

  async testCheckOneSubmit(user_token: string, test_id: string) {
    const user = await this.userTestCheckRepository.find({
      where: {
        user: {
          token: user_token,
        },
        test: {
          test_id: test_id,
        },
      },
    })

    if (user.length > 0) {
      return true;
    } else {
      return false;
    }
  }
}
