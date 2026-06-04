import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** GET /sermons/recent — bounded limit, rejects junk. */
export class RecentSermonsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 12, default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}

/** GET /sermons/feed — cursor-based, bounded page size. */
export class SermonFeedQueryDto {
  @ApiPropertyOptional({ description: 'Opaque keyset cursor from the previous page' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Filter by series' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  series?: string;
}
