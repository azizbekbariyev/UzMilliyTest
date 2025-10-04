import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/bot/models/user.model";
import { Repository } from "typeorm";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}
  async validate(authorization: string) {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      throw new UnauthorizedException("Token topilmadi");
    }

    const user = await this.userRepository.findOne({
      where: { token },
    });
    if (!user) {
      return { isValid: false };
    }
    return {
      role: user.role
    };
  }
}
