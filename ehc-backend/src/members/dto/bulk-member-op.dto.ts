import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';

/** Bulk status / tag operation over a set of member ids (People console). */
export class BulkMemberOpDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ enum: ['status', 'addTag', 'removeTag'] })
  @IsIn(['status', 'addTag', 'removeTag'])
  op!: 'status' | 'addTag' | 'removeTag';

  @ApiProperty({
    description:
      'For op=status: ACTIVE|INACTIVE|TRANSFERRED|DECEASED. For tags: the tag string.',
  })
  @IsString()
  value!: string;
}
