"use client";

import { useState } from "react";
import { Search, Trash2, Shield, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Badge } from "@/components/common/Badge";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminUsers, useUpdateUserRole, useDeleteUser } from "@/hooks/useAdmin";
import { formatDate } from "@/lib/utils";
import type { AdminUserFilterParams, User, Role } from "@/types";

export function UserTable() {
  const [params, setParams] = useState<AdminUserFilterParams>({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmRole, setConfirmRole] = useState<{ user: User; role: Role } | null>(null);

  const { data, isLoading } = useAdminUsers(params);
  const { mutate: updateRole, isPending: roleLoading } = useUpdateUserRole();
  const { mutate: deleteUser, isPending: deleteLoading } = useDeleteUser();

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const currentPage = pagination?.currentPage ?? pagination?.page ?? params.page ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, search: searchInput, page: 1 }));
  };

  const handlePage = (newPage: number) => {
    setParams((p) => ({ ...p, page: newPage }));
  };

  const handleRoleToggle = (user: User) => {
    const newRole: Role = user.role === "ADMIN" ? "USER" : "ADMIN";
    setConfirmRole({ user, role: newRole });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Search className="h-3.5 w-3.5" />
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <UserIcon className="h-8 w-8 mb-2" />
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide sm:table-cell">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              <AnimatePresence>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{user.name}</p>
                          <p className="truncate text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "ADMIN" ? "admin" : "user"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRoleToggle(user)}
                          title={user.role === "ADMIN" ? "Revoke Admin" : "Make Admin"}
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(user)}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            {pagination.totalItems} users · Page {currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => handlePage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => handlePage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete User"
        description="All files belonging to this user will also be permanently deleted."
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800">{confirmDelete?.name}</span>?
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteLoading}
            onClick={() => {
              if (confirmDelete) {
                deleteUser(confirmDelete.id, {
                  onSuccess: () => setConfirmDelete(null),
                });
              }
            }}
          >
            Delete User
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmRole}
        onClose={() => setConfirmRole(null)}
        title="Change User Role"
      >
        <p className="text-sm text-slate-600">
          Change{" "}
          <span className="font-semibold text-slate-800">{confirmRole?.user.name}</span>
          {" "}role to{" "}
          <Badge variant={confirmRole?.role === "ADMIN" ? "admin" : "user"}>
            {confirmRole?.role}
          </Badge>
          ?
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirmRole(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={roleLoading}
            onClick={() => {
              if (confirmRole) {
                updateRole(
                  { id: confirmRole.user.id, role: confirmRole.role },
                  { onSuccess: () => setConfirmRole(null) }
                );
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

