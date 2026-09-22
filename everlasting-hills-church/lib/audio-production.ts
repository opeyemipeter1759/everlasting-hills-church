/**
 * Whether a unit is the Audio Production team, whose members manage sermons
 * without the PASTOR role.
 *
 * Unit names are typed by admins, so an exact `=== "Audio Production"` check
 * silently locked the whole team out the moment the unit was named
 * "Audio production", "AUDIO PRODUCTION " or "Audio Production Unit".
 * Case, spacing and punctuation are ignored. Keep in step with the API's
 * isAudioProductionUnitName (ehc-backend/src/sermons/services/sermons-auth.service.ts).
 */
export function isAudioProductionUnitName(name: unknown): boolean {
  if (typeof name !== "string") return false;
  return name.toLowerCase().replace(/[^a-z]/g, "").includes("audioproduction");
}
