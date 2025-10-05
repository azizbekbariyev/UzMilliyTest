import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserTestCheck } from "./userTestCheck";

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

    @Column({
        default: null
    })
    token: string

    @Column({
        type: "enum",
        enum: ["admin", "user"],
        default: "user"
    })
    role: string

    @OneToMany(()=> UserTestCheck, (userTestCheck) => userTestCheck.user)
    userTestChecks: UserTestCheck[]
}