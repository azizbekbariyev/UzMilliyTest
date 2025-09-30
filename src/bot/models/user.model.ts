import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("user")
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @Column({
        type: "bigint",
        unique: true
    })
    id_telegram: number
}