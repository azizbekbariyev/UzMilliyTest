import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Test } from "./test.model";

@Entity("test_answer")
export class TestAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    default: true
  })
  if_test: boolean;

  @Column()
  option: string;

  @Column()
  option_code: string;

  @Column()
  test_number: number;

  @Column({ nullable: true })
  test_number_string: string;

  @ManyToOne(() => Test, (test) => test.answers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "test_id" })
  test: Test;
}
