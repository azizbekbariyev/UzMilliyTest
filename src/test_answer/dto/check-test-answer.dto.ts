
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

export interface CheckTestAnswerDto {
  test_id: string;
  token: string;
  answers: {
    question_id: number;
    test_number: number | string;
    answer: string;
    if_test: boolean;
    test_number_string: string
  }[];
  testData: {
    code: string;
    firstName: string;
    lastName: string;
    region: string;
    startTime: string;
    testId: string;
  };
  test: {
    id: number;
    is_it_over: boolean;
    name: string;
    open_test_sequential: boolean;
    science_id: number;
    subject_name: string;
    test_id: string;
  }[];
}
