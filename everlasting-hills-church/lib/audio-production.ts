/**
 * Whether a unit is the Audio Production team, whose members manage sermons
 * without the PASTOR role.
 *
 * Unit names are typed by admins, so an exact `=== "Audio Production"` check
 * silently locked the whole team out — the church's unit is actually
 * "Audio Post Production Unit". Any name with "audio" followed later by
 * "prod…" matches, ignoring case, spacing and punctuation (so a misspelt
 * "Prodution" still counts). Keep in step with the API's
 * isAudioProductionUnitName (ehc-backend/src/sermons/services/sermons-auth.service.ts).
 */
export function isAudioProductionUnitName(name: unknown): boolean {
  if (typeof name !== "string") return false;
  return /audio.*prod/.test(name.toLowerCase().replace(/[^a-z]/g, ""));
}
