import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express'; // ⬅️ shu import zarur
import { TestService } from './test.service';
import { join } from 'path';
import * as fs from 'fs';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('test-science/:test_id')
  async findOneTestWithScience(@Param('test_id') test_id: string) {
    return this.testService.findOneTestWithScience(test_id);
  }

  // 2️⃣ — ZIP faylni to‘g‘ridan-to‘g‘ri yuklab olish
  @Get('download/:testId')
  async downloadZip(@Param('testId') testId: string, @Res() res: Response) {
    const zipPath = join(process.cwd(), 'uploads', `${testId}.zip`);

    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ message: '❌ ZIP fayl topilmadi' });
    }
 
    res.download(zipPath, `${testId}.zip`, (err) => {
      if (err) {
        console.error('📛 ZIP yuborishda xatolik:', err);
        res.status(500).json({ message: '📛 ZIP yuborishda xatolik yuz berdi' });
      }
    });
  }
}
