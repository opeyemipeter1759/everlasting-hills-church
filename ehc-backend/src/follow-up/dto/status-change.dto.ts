import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const STATUSES = ['FIRST_TIMER', 'SECOND_TIMER', 'THIRD_TIMER', 'INTEGRATED', 'AWAY', 'OPTED_OUT'];

export class RequestStatusChangeDto {
  @ApiProperty({ enum: ['MEMBER', 'VISITOR'] })
  @IsIn(['MEMBER', 'VISITOR'])
  subjectKind!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty({ enum: STATUSES, description: 'The status the requester saw — kept for the record.' })
  @IsIn(STATUSES)
  fromStatus!: string;

  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  toStatus!: string;

  @ApiProperty({ required: false, description: 'Why — shown to whoever approves it.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class DecideStatusChangeDto {
  @ApiProperty({ description: 'True to approve, false to reject.' })
  @IsBoolean()
  approve!: boolean;
}

class BulkStatusSubjectDto {
  @ApiProperty({ enum: ['MEMBER', 'VISITOR'] })
  @IsIn(['MEMBER', 'VISITOR'])
  subjectKind!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty({ enum: STATUSES, description: 'The status the leader saw — kept for the record.' })
  @IsIn(STATUSES)
  fromStatus!: string;
}

export class BulkStatusChangeDto {
  @ApiProperty({ type: [BulkStatusSubjectDto], description: 'The people whose status changes together.' })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkStatusSubjectDto)
  subjects!: BulkStatusSubjectDto[];

  @ApiProperty({ enum: STATUSES, description: 'What they all become.' })
  @IsIn(STATUSES)
  toStatus!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
