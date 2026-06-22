"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Plus, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";

/**
 * User management CMS.
 *
 * UX rules:
 *   - The role dropdown in the create form shows ONLY roles the actor can assign
 *     (fetched from GET /users/assignable-roles). Backend re-checks on submit.
 *   - The "Change role" inline picker on each row is also filtered the same way.
 *   - Delete is soft (DELETE → sets status=INACTIVE). Confirm before firing.
 *
 * Why one big Client Component instead of split files: small surface area, single
 * resource, and one mutator pattern. Same shape as the testimonials CMS.
 */

type Role = "MEMBER" | "UNIT_LEAD" | "ADMIN" | "PASTOR" | "SUPER_ADMIN";

interface UserRow {
  profileId: string;
  userId: string;
  role: Role;
  createdAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
    status: string;
    joinedAt: string;
  } | null;
}

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
  PASTOR: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  ADMIN: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  UNIT_LEAD: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  MEMBER: "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10",
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
};

type PendingAction =
  | { kind: "delete"; user: UserRow }
  | { kind: "role"; user: UserRow; newRole: Role };

export default function UsersCmsClient() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assignableRoles, setAssignableRoles] = useState<Role[]>([]);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get<UserRow[]>("/users"),
        apiClient.get<Role[]>("/users/assignable-roles"),
      ]);
      setUsers(usersRes.data);
      setAssignableRoles(rolesRes.data);
    } catch (err) {
      setLoadError((err as { message?: string }).message ?? "Failed to load");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!users) return null;
    if (!searchQuery.trim()) return users;
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const m = u.member;
      if (!m) return false;
      return (
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  function requestDelete(u: UserRow) {
    if (!u.member) return;
    setActionError(null);
    setPending({ kind: "delete", user: u });
  }

  function requestRoleChange(u: UserRow, newRole: Role) {
    if (newRole === u.role) return;
    setActionError(null);
    setPending({ kind: "role", user: u, newRole });
  }

  async function confirmPending() {
    if (!pending) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (pending.kind === "delete") {
        await apiClient.delete(`/users/${pending.user.profileId}`);
      } else {
        await apiClient.patch(`/users/${pending.user.profileId}/role`, {
          role: pending.newRole,
        });
      }
      setPending(null);
      await loadAll();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  // Permissions for editing a given row: actor must out-rank the target.
  function canManage(targetRole: Role): boolean {
    return assignableRoles.includes(targetRole);
  }

  const counts = useMemo(() => {
    if (!users) return null;
    const c: Partial<Record<Role, number>> = {};
    for (const u of users) c[u.role] = (c[u.role] ?? 0) + 1;
    return c;
  }, [users]);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users
              ? `${users.length} total — ${Object.entries(counts ?? {})
                  .map(([r, n]) => `${n} ${ROLE_LABELS[r as Role]}`)
                  .join(" · ")}`
              : "Loading…"}
          </p>
        </div>
        {!creating && assignableRoles.length > 0 && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New user
          </button>
        )}
      </div>

      {/* Search */}
      {users && users.length > 0 && (
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or role…"
          className="w-full max-w-md text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
        />
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          {loadError}
        </div>
      )}

      {/* No-permission state */}
      {!loadError && assignableRoles.length === 0 && users !== null && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Your role doesn&apos;t allow creating users. You can view this list but not modify it.
        </div>
      )}

      {/* Create form */}
      {creating && (
        <CreateUserForm
          assignableRoles={assignableRoles}
          onCancel={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await loadAll();
          }}
        />
      )}

      {/* Skeleton */}
      {users === null && !loadError && <SkeletonList />}

      {/* Empty state */}
      {users !== null && filteredUsers !== null && filteredUsers.length === 0 && !creating && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <UserPlus size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {users.length === 0 ? "No users yet" : "No matches"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {users.length === 0
              ? `Click "New user" to add the first one.`
              : `Try a different search term.`}
          </p>
        </div>
      )}

      {/* List */}
      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === "delete"
            ? "Permanently delete this user?"
            : pending?.kind === "role"
              ? `Change role to ${ROLE_LABELS[pending.newRole]}?`
              : ""
        }
        description={
          pending?.kind === "delete" ? (
            <span>
              <strong className="text-gray-900 dark:text-white">
                {pending.user.member?.firstName} {pending.user.member?.lastName}
              </strong>{" "}
              and all their records (attendance, notes, follow-ups, sermon bookmarks) will
              be permanently removed. Their sign-in account is also deleted. This cannot be undone.
              {actionError && (
                <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>
              )}
            </span>
          ) : pending?.kind === "role" ? (
            <span>
              You are about to change{" "}
              <strong className="text-gray-900 dark:text-white">
                {pending.user.member?.firstName} {pending.user.member?.lastName}
              </strong>{" "}
              from <strong>{ROLE_LABELS[pending.user.role]}</strong> to{" "}
              <strong>{ROLE_LABELS[pending.newRole]}</strong>. This grants new permissions immediately.
              {actionError && (
                <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>
              )}
            </span>
          ) : null
        }
        confirmLabel={
          pending?.kind === "delete" ? "Yes, delete permanently" : "Yes, change role"
        }
        tone={pending?.kind === "delete" ? "danger" : "warning"}
        loading={actionLoading}
        onConfirm={confirmPending}
        onCancel={() => {
          if (!actionLoading) {
            setPending(null);
            setActionError(null);
          }
        }}
      />

      {filteredUsers && filteredUsers.length > 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-white/8">
            {filteredUsers.map((u) => (
              <li key={u.profileId} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {u.member?.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={u.member.photoUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center text-sm font-bold text-[#87102C] dark:text-[#e8768a] flex-shrink-0">
                      {(u.member?.firstName?.[0] ?? "?").toUpperCase()}
                      {(u.member?.lastName?.[0] ?? "").toUpperCase()}
                    </span>
                  )}

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {u.member ? `${u.member.firstName} ${u.member.lastName}` : "(no member record)"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      {u.member?.email && (
                        <span className="inline-flex items-center gap-1 truncate min-w-0">
                          <Mail size={11} className="flex-shrink-0" />
                          <span className="truncate">{u.member.email}</span>
                        </span>
                      )}
                      {u.member?.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} />
                          {u.member.phone}
                        </span>
                      )}
                      {u.member?.status === "INACTIVE" && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canManage(u.role) ? (
                      <select
                        value={u.role}
                        onChange={(e) => requestRoleChange(u, e.target.value as Role)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border cursor-pointer ${ROLE_BADGE[u.role]}`}
                      >
                        {/* Current role at top so it shows even if not in the assignable list */}
                        <option value={u.role}>{ROLE_LABELS[u.role]}</option>
                        {assignableRoles
                          .filter((r) => r !== u.role)
                          .map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${ROLE_BADGE[u.role]}`}
                      >
                        <ShieldCheck size={10} />
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
                    {canManage(u.role) && (
                      <button
                        type="button"
                        onClick={() => requestDelete(u)}
                        title="Deactivate"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Create form ──────────────────────────────────────────────────────────────

interface CreateFormProps {
  assignableRoles: Role[];
  onCancel: () => void;
  onCreated: () => Promise<void>;
}

const inputCls =
  "w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

function CreateUserForm({ assignableRoles, onCancel, onCreated }: CreateFormProps) {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: assignableRoles[0] ?? ("MEMBER" as Role),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/users", {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        role: data.role,
      });
      await onCreated();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">New user</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name *">
          <input
            required
            type="text"
            maxLength={80}
            value={data.firstName}
            onChange={(e) => setData({ ...data, firstName: e.target.value })}
            placeholder="Jane"
            className={inputCls}
          />
        </Field>
        <Field label="Last name *">
          <input
            required
            type="text"
            maxLength={80}
            value={data.lastName}
            onChange={(e) => setData({ ...data, lastName: e.target.value })}
            placeholder="Doe"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Email *">
        <input
          required
          type="email"
          maxLength={254}
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          placeholder="jane.doe@example.com"
          className={inputCls}
        />
      </Field>

      <Field label="Phone * (used as initial password — they change it on first login)">
        <input
          required
          type="tel"
          minLength={6}
          maxLength={40}
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          placeholder="+234 801 234 5678"
          className={inputCls}
        />
      </Field>

      <Field label="Role">
        <select
          value={data.role}
          onChange={(e) => setData({ ...data, role: e.target.value as Role })}
          className={inputCls}
        >
          {assignableRoles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1.5">
          You can only assign roles below yours.
        </p>
      </Field>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Creating…" : "Create user"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <ul className="divide-y divide-gray-100 dark:divide-white/8">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-40 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-56 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
            <div className="h-5 w-20 bg-gray-200 dark:bg-white/10 rounded" />
          </li>
        ))}
      </ul>
    </div>
  );
}
