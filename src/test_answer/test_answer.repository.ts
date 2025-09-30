import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

export class TestAnswerRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  getTestAnswerWithTestId(test_id: string) {
    return this.dataSource.query(
      `SELECT *
FROM test t
LEFT JOIN test_answer ta ON ta.test_id = t.id
WHERE t.test_id = $1
`,
      [test_id]
    );
  }
}
