import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { FRIEND_OR_FAMILY, HEARD_OTHER } from '../../forms/first-timer-heard-from.schema';

export class UpdateVisitorDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  howDidYouLearn?: string;

  /** Required when the same edit sets howDidYouLearn to Friend or Family. An edit to another field never touches it. */
  @ApiProperty({ required: false })
  @ValidateIf((o: UpdateVisitorDto) => o.howDidYouLearn === FRIEND_OR_FAMILY || !!o.invitedBy)
  @IsString()
  @IsNotEmpty({ message: 'Tell us who invited them' })
  @MaxLength(120)
  invitedBy?: string;

  /** Required when the same edit sets howDidYouLearn to Other. */
  @ApiProperty({ required: false })
  @ValidateIf((o: UpdateVisitorDto) => o.howDidYouLearn === HEARD_OTHER || !!o.heardFromOther)
  @IsString()
  @IsNotEmpty({ message: 'Tell us how they heard about us' })
  @MaxLength(200)
  heardFromOther?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isStudent?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  locatedInIbadan?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  membershipInterest?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bornAgain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  serviceExperience?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prayerPoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  attendanceType?: string;
}
