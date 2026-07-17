import type { DirectoryParams, PersonRole, PersonRow } from "@/lib/api/people";
import CreatePeopleDialog from "../CreatePeopleDialog";
import AssignMembersDialog from "../AssignMembersDialog";
import EditMemberDialog from "../EditMemberDialog";
import TagDialog from "../TagDialog";
import PeopleFilterPanel from "../PeopleFilterPanel";

type FilterValue = Pick<DirectoryParams, "status" | "gender" | "unit" | "birthMonth" | "joinedFrom" | "joinedTo">;

export default function PeopleDialogs({
  createOpen,
  onCloseCreate,
  assignableRoles,
  assignOpen,
  assignPreselect,
  onCloseAssign,
  filterOpen,
  onCloseFilter,
  filterValue,
  onApplyFilter,
  editTarget,
  onCloseEdit,
  tagTarget,
  onCloseTag,
}: {
  createOpen: boolean;
  onCloseCreate: () => void;
  assignableRoles: PersonRole[];
  assignOpen: boolean;
  assignPreselect: PersonRow[];
  onCloseAssign: () => void;
  filterOpen: boolean;
  onCloseFilter: () => void;
  filterValue: FilterValue;
  onApplyFilter: (adv: Partial<DirectoryParams>) => void;
  editTarget: PersonRow | null;
  onCloseEdit: () => void;
  tagTarget: PersonRow | null;
  onCloseTag: () => void;
}) {
  return (
    <>
      <CreatePeopleDialog open={createOpen} onClose={onCloseCreate} assignableRoles={assignableRoles} />
      <AssignMembersDialog open={assignOpen} onClose={onCloseAssign} preselected={assignPreselect} />
      <PeopleFilterPanel open={filterOpen} onClose={onCloseFilter} value={filterValue} onApply={onApplyFilter} />
      <EditMemberDialog person={editTarget} onClose={onCloseEdit} />
      <TagDialog person={tagTarget} onClose={onCloseTag} />
    </>
  );
}
