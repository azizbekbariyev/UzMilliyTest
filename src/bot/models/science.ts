import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Test } from "./test.model";


// science.model.ts
@Entity("science")
export class Science {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Test, (test) => test.science)
  tests: Test[];
}
