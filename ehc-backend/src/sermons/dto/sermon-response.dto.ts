import { ApiProperty } from '@nestjs/swagger';
import type { MediaType, SermonRecord } from '../recent/sermon-repository';

/**
 * Public sermon shape. Deliberately omits internal fields (tenantId, published) so
 * the entity never leaks. `ctaLabel` is computed from mediaType server-side for copy
 * consistency; `mediaType` is also exposed so the client can re-derive or localize.
 */
export class SermonResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() speaker!: string;
  @ApiProperty({ description: 'ISO date the sermon was preached' }) preachedAt!: string;
  @ApiProperty({ required: false, nullable: true }) series?: string | null;
  @ApiProperty({ required: false, nullable: true }) description?: string | null;
  @ApiProperty({ enum: ['audio', 'video', 'both'] }) mediaType!: MediaType;
  @ApiProperty({ enum: ['Watch', 'Listen'] }) ctaLabel!: 'Watch' | 'Listen';
  @ApiProperty({ required: false, nullable: true }) videoUrl?: string | null;
  @ApiProperty({ required: false, nullable: true }) audioUrl?: string | null;
  @ApiProperty({ required: false, nullable: true }) thumbnailUrl?: string | null;
  @ApiProperty({ required: false, nullable: true }) durationSeconds?: number | null;
}

export function ctaLabelFor(mediaType: MediaType): 'Watch' | 'Listen' {
  return mediaType === 'audio' ? 'Listen' : 'Watch';
}

export function toSermonResponse(record: SermonRecord): SermonResponseDto {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    speaker: record.speaker,
    preachedAt: record.preachedAt,
    series: record.series ?? null,
    description: record.description ?? null,
    mediaType: record.mediaType,
    ctaLabel: ctaLabelFor(record.mediaType),
    videoUrl: record.videoUrl ?? null,
    audioUrl: record.audioUrl ?? null,
    thumbnailUrl: record.thumbnailUrl ?? null,
    durationSeconds: record.durationSeconds ?? null,
  };
}
