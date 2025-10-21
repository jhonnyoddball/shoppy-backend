/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import ms from 'ms';
import { User } from '@prisma/client/wasm';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './token-payload.interface';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  login(user: User, response: Response) {
    const expires = new Date();
    const jwtExpires = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');
    const expiresMs = ms(jwtExpires as any) as unknown as number;
    expires.setMilliseconds(expires.getMilliseconds() + expiresMs);

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };

    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      secure: true,
      httpOnly: true,
      expires,
    });
    return { tokenPayload };
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.usersService.getUser({ email });
      const authenticated = await bcrypt.compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Credentials are invalid');
    }
  }

  verifyToken(jwt: string) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(jwt);
      return payload;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Token is invalid');
    }
  }
}
