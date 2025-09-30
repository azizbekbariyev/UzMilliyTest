
class TestDataDto {
  testId: string;
  firstName: string;
  lastName: string;
  region: string;
  code: string;
  startTime: string;
}

class TestInfoDto {
  id: number;
  test_id: string;
  subject_name: string;
  is_it_over: boolean;
  science_id: number;
  name: string;
}

export class CheckTestAnswerDto {
  answers: { 
    [id: string]: { value: string; if_test: boolean } 
  };
  testData: TestDataDto;
  test: TestInfoDto[];
}
