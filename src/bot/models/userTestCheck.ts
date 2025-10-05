import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.model';
import { Test } from './test.model';

@Entity('user_test_check')
export class UserTestCheck {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.userTestChecks, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Test, (test) => test.userTestChecks, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'test_id' })
    test: Test;
}
