/**
 * Whether a unit is Audio (Post) Production — the unit whose members get full
 * Super Admin power over sermons without holding a role for it.
 *
 * Unit names are typed by admins, so an exact 'Audio Production' match locked
 * the whole team out — the church's unit is actually "Audio Post Production
 * Unit". Any name with "audio" followed later by "prod…" matches, ignoring
 * case, spacing and punctuation (so a misspelt "Prodution" still counts).
 * Keep in step with the website's isAudioProductionUnitName
 * (everlasting-hills-church/lib/audio-production.ts).
 */
export function isAudioProductionUnitName(name: string): boolean {
  return /audio.*prod/.test(name.toLowerCase().replace(/[^a-z]/g, ''));
}
