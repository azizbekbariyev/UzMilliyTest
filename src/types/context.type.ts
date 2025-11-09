import { Context as TelegrafContext } from 'telegraf';

interface Session {
  science: boolean
  countTest: boolean
  openTest: boolean
  name:boolean
}

interface SessionText{
  scienceText: string
  countTestText: string
  openTestText: string
}

export interface MyContext extends TelegrafContext {
  session: Session & SessionText;
}

export interface AddTestAnswer {
  subject: {
    id: number;
    value: string;
  };
  yopiq_testlar: Record<string, TestVariant>;
  ochiq_testlar: Record<string, string>;
  open_test_sequential?: boolean;
  photo: number
}

export interface TestVariant {
  test_variants: string[];
  correct_variant: string;
}