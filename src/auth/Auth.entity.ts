import { User } from "src/user/User.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Auth {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    password: string;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;
}