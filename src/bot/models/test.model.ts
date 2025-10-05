import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TestAnswer } from "./test_answer";
import { Science } from "./science";
import { UserTestCheck } from "./userTestCheck";

// test.model.ts
@Entity("test")
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true
  })
  test_id: string;

  @Column()
  subject_name: string;

  @Column()
  is_it_over: boolean;

  @OneToMany(() => TestAnswer, (answer) => answer.test)
  answers: TestAnswer[];

  @ManyToOne(() => Science, (science) => science.tests)
  @JoinColumn({ name: "science_id" })
  science: Science;

  @OneToMany(()=>UserTestCheck, (userTestCheck) => userTestCheck.test)
  userTestChecks: UserTestCheck[]
}
