import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './current-user.decorator';
import * as client from '@prisma/client';
import { AuthService } from './auth.service';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @CurrentUser() user: client.User,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.login(user, response);
  }
}
