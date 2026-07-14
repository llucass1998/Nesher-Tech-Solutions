import { Body, Controller, Delete, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto';
import { getJwks } from './key-store';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('api/v1/auth/login')
  login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(body, req, res);
  }

  @Post('api/v1/auth/refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('api/v1/auth/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  @Get('api/v1/auth/me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.me(authorization);
  }

  @Get('api/v1/auth/sessions')
  sessions(@Headers('authorization') authorization?: string) {
    return this.authService.sessions(authorization);
  }

  @Delete('api/v1/auth/sessions/:id')
  revokeSession(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.authService.revokeSession(authorization, id);
  }

  @Delete('api/v1/auth/sessions')
  revokeAllSessions(@Headers('authorization') authorization?: string) {
    return this.authService.revokeAllSessions(authorization);
  }

  @Get('.well-known/jwks.json')
  jwks() {
    return getJwks();
  }

  @Post('api/v1/users')
  createUser(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }
}
