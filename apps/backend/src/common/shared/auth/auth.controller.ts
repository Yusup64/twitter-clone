import {
  Controller,
  Post,
  Body,
  Req,
  HttpStatus,
  HttpCode,
  Get,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsPublic } from '@/src/common/decorators';
import { RegisterDto, LoginDto, UpdateProfileDto } from '../dto';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserAuth } from '../../decorators/user.decorator';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  @IsPublic()
  @Post('register')
  @ApiCreatedResponse({ type: RegisterDto })
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @IsPublic()
  @Post('login')
  @ApiCreatedResponse({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @IsPublic()
  @Post('refresh')
  @ApiCreatedResponse({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req) {
    const refreshToken = req.headers.authorization?.split(' ')[1];
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('me')
  @ApiCreatedResponse()
  @HttpCode(HttpStatus.OK)
  async getMe(@UserAuth() user: User) {
    return this.authService.getMe(user);
  }

  @Post('update-profile')
  @ApiCreatedResponse({ type: UpdateProfileDto })
  @HttpCode(HttpStatus.OK)
  async updateProfile(@UserAuth() user: User, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      console.error('Auth verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}
