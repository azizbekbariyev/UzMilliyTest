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
