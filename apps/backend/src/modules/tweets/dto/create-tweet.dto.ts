import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateTweetDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  mediaUrls?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  mediaFiles?: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  hasMedia?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  hashtags?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  pollId?: string;
}

export class CreateCommentDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  content: string;
}
