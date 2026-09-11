import { UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard, PermissionsGuard } from '../../shared/guards/auth.guard';
import { Body, Controller, Delete, Get, Headers, Param, Post, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateRegistrationRequestDto, CreateUserDto, LoginDto } from './dto';
import { getJwks } from './key-store';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('api/v1/auth/login')
  login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(body, req, res);
  }

  @Post('api/v1/auth/registration-requests')
  registrationRequest(@Body() body: CreateRegistrationRequestDto, @Req() req: Request) {
    return this.authService.createRegistrationRequest(body, req);
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

  
  @Post('api/v1/auth/mfa/setup')
  setupMfa(@Headers('authorization') authorization?: string) {
    return this.authService.setupMfa(authorization);
  }

  @Post('api/v1/auth/mfa/verify')
  verifyMfaSetup(@Body() body: import('./dto').VerifyMfaDto, @Headers('authorization') authorization?: string) {
    return this.authService.verifyMfaSetup(body.code, authorization);
  }

  
  @Post('api/v1/auth/token')
  token(@Body() body: any) {
    return this.authService.token(body);
  }

  @Get('.well-known/jwks.json')
  jwks() {
    return getJwks();
  }

  @Post('api/v1/users')
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('permissions', ['identity.admin'])
  createUser(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }
}
