import type { FieldDef } from "./StructuredForm";
import { homeFields } from "./structured-fields-home";
import { MAIN_PAGE_FIELDS } from "./structured-fields-main-pages";
import { SPECIAL_PAGE_FIELDS } from "./structured-fields-special-pages";
import { VISIT_GIVE_FIELDS } from "./structured-fields-visit-give";
import { picnicFields } from "./structured-fields-picnic";

export const STRUCTURED_FIELDS: Record<string, FieldDef[]> = {
  home: homeFields,
  picnic: picnicFields,
  ...MAIN_PAGE_FIELDS,
  ...VISIT_GIVE_FIELDS,
  ...SPECIAL_PAGE_FIELDS,
};

export function structuredFields(contentType: string): FieldDef[] | undefined {
  return STRUCTURED_FIELDS[contentType];
}
