import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

export class TestRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async findOneTestWithScience(test_id: string) {
    const test = await this.dataSource.query(
      `SELECT *
FROM test t
LEFT JOIN science s ON s.id = t.science_id
WHERE t.test_id = $1
`,
      [test_id]
    );
    return test
  }
}
