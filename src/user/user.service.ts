import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./User.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}


    async createUser(user: {name: string, email: string}): Promise<User> {
        const existingUser = await this.userRepository.findOneBy({
            email: user.email
        });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }
        const newUser = new User();
        newUser.name = user.name;
        newUser.email = user.email;
        return await this.userRepository.save(newUser);
    }

    async getUser(id: string): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}