import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const QUESTION_STATUSES = ['PENDING', 'ANSWERED'] as const;

/** Optional text fields sometimes arrive as "" (a field mounted-then-hidden by
 * a conditional form still submits its last value) — treat that the same as
 * absent so @IsOptional() actually skips validation instead of e.g. @IsEmail
 * rejecting an empty string. */
const blankToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class QuestionDto {
  @ApiProperty({ example: 'What time is the Sunday second service?' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  question!: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: '+1 (555) 123-4567', required: false })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}

export class UpdateQuestionStatusDto {
  @ApiProperty({ enum: QUESTION_STATUSES, example: 'ANSWERED' })
  @IsIn(QUESTION_STATUSES)
  status!: (typeof QUESTION_STATUSES)[number];
}
