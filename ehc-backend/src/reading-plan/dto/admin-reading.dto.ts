import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ClearGoneQuietDto {
  @ApiProperty({
    minimum: 0,
    description:
      'How many plans the admin was shown and confirmed. If gone quiet has changed since, nothing is removed.',
  })
  @IsInt()
  @Min(0)
  @Max(100_000)
  expectedPlans!: number;
}

export class ClearGoneQuietResultDto {
  @ApiProperty({ description: 'Plans removed, kept as history rather than deleted' })
  removedPlans!: number;

  @ApiProperty({ description: 'Members those plans belonged to' })
  members!: number;
}
