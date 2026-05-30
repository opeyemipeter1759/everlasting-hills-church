/**
 * Legacy barrel kept temporarily to avoid breaking existing imports.
 * New code should import directly from the per-module dto/ folders.
 * TODO: delete once all imports have been migrated to per-module locations.
 */
export { LoginDto } from '../auth/dto/login.dto';
export { FirstTimerDto } from '../forms/dto/first-timer.dto';
export { PrayerRequestDto } from '../forms/dto/prayer-request.dto';
export { TestimonyDto } from '../forms/dto/testimony.dto';
export { CreateSermonDto } from '../sermons/dto/create-sermon.dto';
export { SermonEpisodeInputDto } from '../sermons/dto/sermon-episode.dto';
export { UpdateSermonDto } from '../sermons/dto/update-sermon.dto';
export { SubscribeEmailDto } from '../sermons/dto/subscribe-email.dto';
