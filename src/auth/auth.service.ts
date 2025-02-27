import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Auth } from "./Auth.entity";
import { UserService } from "src/user/user.service";
import { User } from "src/user/User.entity";
import { SignUpDto } from "./dto/signUp.dto";
import { createHash } from 'crypto';
import { SignInDto } from "./dto/signIn.dto";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Auth)
        private authRepository: Repository<Auth>,
        private userService: UserService,
        private jwtService: JwtService,
    ) {}

    async signUp(signUpDto: SignUpDto): Promise<User> {
        const user = await this.userService.createUser({
            name: signUpDto.name,
            email: signUpDto.email,
        });
        const auth = new Auth();
        auth.password = createHash('sha256').update(signUpDto.password).digest('hex');
        auth.user = user;
        const {id, ...userWithoutId} = user;
        await this.authRepository.save(auth);
        return userWithoutId
    }

    async signIn(signInDto: SignInDto): Promise<{ access_token: string }> {
        const auth = await this.authRepository.findOne({
            relations: {
                user: true,
            },
            where: {
                user: {
                    email: signInDto.email,
                },
            },
        });

        if (!auth) {
            throw new NotFoundException('User not found');
        }

        if (auth.password !== createHash('sha256').update(signInDto.password).digest('hex')) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: auth.user.id, email: auth.user.email };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async verify(req: Request): Promise<boolean> {
        try {
            if (!req.headers.authorization) {
                throw new UnauthorizedException('No token provided');
            }
            const [type,token] = req.headers.authorization.split(' ') ?? [];
            if (type !== 'Bearer' || !token) {
                throw new UnauthorizedException('Invalid token');
            }
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: process.env.JWT_SECRET,
                }
            );
            return true;
        } catch (error) {
            return false;
        }
    }
}