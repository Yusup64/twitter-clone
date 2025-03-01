import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, ArrayMinSize } from 'class-validator';

export class CreatePollDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  options: string[];

  @ApiProperty()
  @IsDateString()
  expiresAt: Date;
}
