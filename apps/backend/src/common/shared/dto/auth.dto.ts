import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty()
  password: string;

  @IsString()
  @ApiProperty()
  username?: string;

  @IsString()
  @ApiProperty()
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @ApiProperty()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({ required: false })
  displayName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  bio?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  location?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  website?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  coverPhoto?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  username?: string;
}
