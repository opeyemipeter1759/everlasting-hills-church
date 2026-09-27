import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ACTION_KINDS,
  CONTACT_STATUSES,
  FOLLOW_UP_FLAGS,
  NEXT_ACTIONS,
  REVIEW_OUTCOMES,
  SAVED_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from '../evangelism.types';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : typeof value === 'string' ? value.trim() : value;
const toBool = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

/** A contact, as recorded from the field — the public form and the dashboard share it. */
export class EvangelismContactDto {
  @ApiProperty({ example: 'Chinedu Okeke' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '0803 123 4567', description: 'Nigerian mobile: 080…, +234…' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(24)
  phone!: string;

  @ApiProperty({ example: '12 Adeola Street, Ikeja' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @ApiProperty({ enum: SAVED_STATUSES })
  @IsIn(SAVED_STATUSES)
  savedStatus!: (typeof SAVED_STATUSES)[number];

  @ApiProperty()
  @IsBoolean()
  isStudent!: boolean;

  @ApiPropertyOptional({ example: 'University of Lagos' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  school?: string;

  @ApiPropertyOptional({ example: '300 Level' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  level?: string;

  @ApiPropertyOptional({ description: 'What was discussed, their response, prayer requests, needs' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  discussion?: string;

  @ApiPropertyOptional({ description: 'Evangelism Team member who preached to them' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  workerMemberId?: string;

  @ApiPropertyOptional({ description: '"Other": a worker not on the team list' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  workerName?: string;

  @ApiPropertyOptional({ description: 'Blank for personal evangelism' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  outreachId?: string;

  @ApiPropertyOptional({ example: '2026-09-27', description: 'Defaults to today' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  contactDate?: string;

  @ApiPropertyOptional({ enum: NEXT_ACTIONS })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(NEXT_ACTIONS)
  nextAction?: (typeof NEXT_ACTIONS)[number];

  @ApiProperty({ description: 'The person agreed to be contacted by the church' })
  @IsBoolean()
  consent!: boolean;
}

export class PublicEvangelismContactDto extends EvangelismContactDto {
  /** Honeypot: hidden from people, filled in by bots. */
  @ApiPropertyOptional({ description: 'Leave empty' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

/** A leader's edit — any field, including who preached. */
export class UpdateEvangelismContactDto {
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(24) phone?: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(300) address?: string;
  @ApiPropertyOptional({ enum: SAVED_STATUSES }) @IsOptional() @IsIn(SAVED_STATUSES) savedStatus?: (typeof SAVED_STATUSES)[number];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isStudent?: boolean;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160) school?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(60) level?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(4000) discussion?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() workerMemberId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) workerName?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() outreachId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() contactDate?: string;
  @ApiPropertyOptional({ enum: NEXT_ACTIONS, nullable: true }) @IsOptional() @IsIn([...NEXT_ACTIONS, null]) nextAction?: (typeof NEXT_ACTIONS)[number] | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() consent?: boolean;
}

export class ListEvangelismContactsQuery {
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() @MaxLength(120) search?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() workerMemberId?: string;
  @ApiPropertyOptional({ description: '"none" for personal evangelism' }) @Transform(emptyToUndefined) @IsOptional() @IsString() outreachId?: string;
  @ApiPropertyOptional({ enum: SAVED_STATUSES }) @Transform(emptyToUndefined) @IsOptional() @IsIn(SAVED_STATUSES) savedStatus?: string;
  @ApiPropertyOptional() @Transform(toBool) @IsOptional() @IsBoolean() isStudent?: boolean;
  @ApiPropertyOptional({ enum: CONTACT_STATUSES }) @Transform(emptyToUndefined) @IsOptional() @IsIn(CONTACT_STATUSES) status?: string;
  @ApiPropertyOptional({ enum: FOLLOW_UP_FLAGS }) @Transform(emptyToUndefined) @IsOptional() @IsIn(FOLLOW_UP_FLAGS) flag?: string;
  @ApiPropertyOptional({ description: 'Only my contacts still in their 30-day window' }) @Transform(toBool) @IsOptional() @IsBoolean() mine?: boolean;
  @ApiPropertyOptional({ description: 'Contacts this person follows up (assigned, or preached to with nobody else assigned)' }) @Transform(emptyToUndefined) @IsOptional() @IsString() assigneeMemberId?: string;
  @ApiPropertyOptional({ description: 'Only contacts with feedback I have not read' }) @Transform(toBool) @IsOptional() @IsBoolean() unread?: boolean;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ default: 50 }) @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(5000) take?: number;
  @ApiPropertyOptional({ default: 0 }) @Type(() => Number) @IsOptional() @IsInt() @Min(0) skip?: number;
}

/** A follow-up logged against a contact, optionally moving their status on. */
export class LogEvangelismActionDto {
  @ApiPropertyOptional({ enum: ACTION_KINDS, description: 'Omit for a status change only' })
  @IsOptional()
  @IsIn(ACTION_KINDS)
  kind?: (typeof ACTION_KINDS)[number];

  @ApiPropertyOptional({ example: 'Reached — will come on Sunday' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  outcome?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @ApiPropertyOptional({ enum: CONTACT_STATUSES })
  @IsOptional()
  @IsIn(CONTACT_STATUSES)
  status?: (typeof CONTACT_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Required when status is CALL_BACK' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  callBackAt?: string;

  @ApiPropertyOptional({ description: 'When it happened; defaults to now' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  happenedAt?: string;
}

export class AssignEvangelismContactDto {
  @ApiProperty({ nullable: true, description: 'Team member to follow them up; null hands it back to the worker who preached' })
  @IsOptional()
  @IsString()
  assigneeMemberId!: string | null;
}

export class EvangelismNoteDto {
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional({ description: 'The message this answers, when it is a reply.' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class EditEvangelismNoteDto {
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;
}

export class ReactEvangelismNoteDto {
  @ApiProperty({ description: 'A single emoji.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji!: string;
}

export class ReviewEvangelismContactDto {
  @ApiProperty({ enum: REVIEW_OUTCOMES })
  @IsIn(REVIEW_OUTCOMES)
  outcome!: (typeof REVIEW_OUTCOMES)[number];

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  extendDays?: number;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class EvangelismTaskDto {
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() contactId?: string;
  @ApiProperty({ enum: TASK_TYPES }) @IsIn(TASK_TYPES) type!: (typeof TASK_TYPES)[number];
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsDateString() dueAt?: string;
  @ApiPropertyOptional({ enum: TASK_PRIORITIES }) @IsOptional() @IsIn(TASK_PRIORITIES) priority?: (typeof TASK_PRIORITIES)[number];
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) assigneeIds!: string[];
}

export class UpdateEvangelismTaskDto {
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(4000) description?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() contactId?: string | null;
  @ApiPropertyOptional({ enum: TASK_TYPES }) @IsOptional() @IsIn(TASK_TYPES) type?: (typeof TASK_TYPES)[number];
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateString() dueAt?: string | null;
  @ApiPropertyOptional({ enum: TASK_PRIORITIES }) @IsOptional() @IsIn(TASK_PRIORITIES) priority?: (typeof TASK_PRIORITIES)[number];
  @ApiPropertyOptional({ enum: TASK_STATUSES }) @IsOptional() @IsIn(TASK_STATUSES) status?: (typeof TASK_STATUSES)[number];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) assigneeIds?: string[];
}

export class ListEvangelismTasksQuery {
  @ApiPropertyOptional({ enum: ['mine', 'all'], default: 'mine' }) @IsOptional() @IsIn(['mine', 'all']) scope?: 'mine' | 'all';
  @ApiPropertyOptional({ enum: TASK_STATUSES }) @Transform(emptyToUndefined) @IsOptional() @IsIn(TASK_STATUSES) status?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() contactId?: string;
}

export class EvangelismTaskNoteDto {
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(2000) body!: string;
}

export class EvangelismOutreachDto {
  @ApiProperty({ example: 'Street Outreach – Sept 2026' }) @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @ApiProperty({ example: '2026-09-27' }) @IsDateString() date!: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() @MaxLength(200) location?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;
  @ApiPropertyOptional({ type: [String], description: 'Team members who went' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  workerIds?: string[];
}

export class UpdateEvangelismOutreachDto {
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(4000) description?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) workerIds?: string[];
}

export class EvangelismTestimonyDto {
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @ApiProperty() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(8000) body!: string;
  @ApiPropertyOptional({ description: 'Defaults to today' }) @Transform(emptyToUndefined) @IsOptional() @IsDateString() date?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() contactId?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() outreachId?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsString() workerMemberId?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(1000) photoUrl?: string;
}

export class UpdateEvangelismTestimonyDto {
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(8000) body?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() contactId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() outreachId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() workerMemberId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(1000) photoUrl?: string | null;
  @ApiPropertyOptional({ description: 'Approved to share (leaders only)' }) @IsOptional() @IsBoolean() approved?: boolean;
}

export class EvangelismPerformanceQuery {
  @ApiPropertyOptional({ enum: ['month', 'quarter', 'all'], default: 'month' })
  @IsOptional()
  @IsIn(['month', 'quarter', 'all'])
  range?: 'month' | 'quarter' | 'all';
}
