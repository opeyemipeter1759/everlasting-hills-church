import { ApiProperty } from '@nestjs/swagger';
import { SermonStatus } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email?: string;

  @ApiProperty({ example: 'password' })
  password?: string;
}

export class FirstTimerDto {
  @ApiProperty({ example: 'Freya', required: true })
  first_name!: string;

  @ApiProperty({ example: 'Hall', required: true })
  last_name!: string;

  @ApiProperty({ example: '+1 (644) 543-9874', required: true })
  phone_number!: string;

  @ApiProperty({ example: 'jimeqaquh@mailinator.com', required: false })
  email?: string;

  @ApiProperty({ example: 'Female', required: false })
  gender?: string;

  @ApiProperty({ example: 'Online', required: false })
  attendance_type?: string;

  @ApiProperty({ example: 'Social Media', required: false })
  how_did_you_learn?: string;

  @ApiProperty({ example: '', required: false })
  invited_by?: string;

  @ApiProperty({ example: false, required: false })
  located_in_ibadan?: boolean;

  @ApiProperty({ example: 'Maybe', required: false })
  membership_interest?: string;

  @ApiProperty({ example: 'Dignissimos et eos u', required: false })
  address?: string;

  @ApiProperty({ example: 'Eos aspernatur quam', required: false })
  occupation?: string;

  @ApiProperty({ example: 'No', required: false })
  born_again?: string;

  @ApiProperty({ example: 'In placeat nostrum ', required: false })
  service_experience?: string;

  @ApiProperty({ example: 'Mollitia esse invent', required: false })
  prayer_point?: string;

  @ApiProperty({ example: false, required: false })
  whatsapp_interest?: boolean;

  @ApiProperty({ example: '27', required: false })
  birth_day?: string;

  @ApiProperty({ example: 'June', required: false })
  birth_month?: string;

  @ApiProperty({ example: 'FIRST_TIMER', required: false })
  type?: string;
}

export class PrayerRequestDto {
  @ApiProperty({ example: 'Please pray for my family and my job.', required: true })
  request!: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '+1 (555) 123-4567', required: false })
  phone?: string;

  @ApiProperty({ example: false, required: false })
  is_anonymous?: boolean;
}

export class TestimonyDto {
  @ApiProperty({ example: 'God answered my prayer', required: false })
  title?: string;

  @ApiProperty({ example: 'God healed me after the Sunday service.', required: false })
  testimony?: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'jane@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '+1 (555) 987-6543', required: false })
  phone?: string;
}

export class CreateSermonDto {
  @ApiProperty({ example: 'The Power of Faith' })
  title!: string;

  @ApiProperty({ example: 'Pastor John' })
  speaker!: string;

  @ApiProperty({ example: '2026-05-25T09:00:00.000Z' })
  date!: string;

  @ApiProperty({ example: 'A message on trusting God through trials.', required: false })
  description?: string;

  @ApiProperty({ example: 'Full transcript text...', required: false })
  transcript?: string;

  @ApiProperty({ example: 'Hebrews 11:1', required: false })
  scriptureRef?: string;

  @ApiProperty({ example: 'Faith Series', required: false })
  series?: string;

  @ApiProperty({ example: ['faith', 'hope'], required: false, isArray: true })
  tags?: string[];

  @ApiProperty({ example: 'https://cdn.example.com/audio.mp3', required: false })
  audioUrl?: string;

  @ApiProperty({ example: 'storage/audio-key', required: false })
  audioKey?: string;

  @ApiProperty({ example: 3150, required: false })
  audioDuration?: number;

  @ApiProperty({ example: 'https://youtube.com/watch?v=abc123', required: false })
  videoUrl?: string;

  @ApiProperty({ example: 'https://cdn.example.com/thumbnail.jpg', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ example: 'DRAFT', required: false, enum: SermonStatus })
  status?: SermonStatus;

  @ApiProperty({ example: '2026-06-01T09:00:00.000Z', required: false })
  scheduledFor?: string;
}

export class UpdateSermonDto {
  @ApiProperty({ example: 'The Power of Faith', required: false })
  title?: string;

  @ApiProperty({ example: 'Pastor John', required: false })
  speaker?: string;

  @ApiProperty({ example: '2026-05-25T09:00:00.000Z', required: false })
  date?: string;

  @ApiProperty({ example: 'A message on trusting God through trials.', required: false })
  description?: string;

  @ApiProperty({ example: 'Full transcript text...', required: false })
  transcript?: string;

  @ApiProperty({ example: 'Hebrews 11:1', required: false })
  scriptureRef?: string;

  @ApiProperty({ example: 'Faith Series', required: false })
  series?: string;

  @ApiProperty({ example: ['faith', 'hope'], required: false, isArray: true })
  tags?: string[];

  @ApiProperty({ example: 'https://cdn.example.com/audio.mp3', required: false })
  audioUrl?: string;

  @ApiProperty({ example: 'storage/audio-key', required: false })
  audioKey?: string;

  @ApiProperty({ example: 3150, required: false })
  audioDuration?: number;

  @ApiProperty({ example: 'https://youtube.com/watch?v=abc123', required: false })
  videoUrl?: string;

  @ApiProperty({ example: 'https://cdn.example.com/thumbnail.jpg', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ example: 'PUBLISHED', required: false, enum: SermonStatus })
  status?: SermonStatus;

  @ApiProperty({ example: '2026-06-01T09:00:00.000Z', required: false })
  scheduledFor?: string;

  @ApiProperty({ example: true, required: false })
  isFeatured?: boolean;
}

export class SubscribeEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}
