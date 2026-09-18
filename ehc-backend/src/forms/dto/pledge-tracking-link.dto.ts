import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

/** Asks for the private tracking link of the pledge made with this address. */
export class PledgeTrackingLinkDto {
  @ApiProperty({ example: 'tomike@example.com' })
  @IsEmail({}, { message: 'Enter the email address you pledged with' })
  @MaxLength(160)
  email!: string;
}
