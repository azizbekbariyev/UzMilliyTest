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
    id:number,
    value:string
  };
  yopiq_testlar: Record<string | number, string>;
  ochiq_testlar: Record<string, string>;
}