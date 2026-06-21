import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { deleteUser, getUserDeleteRestriction, getUsers, type ManagedUser } from "@/lib/api";

function UserActions({
  user,
  onDelete,
  inline = false,
  deleteDisabledReason,
}: {
  user: ManagedUser;
  onDelete: (id: number) => void;
  inline?: boolean;
  deleteDisabledReason?: string | null;
}) {
  return (
    <div className={inline ? "flex justify-end gap-2" : "flex gap-2"}>
      <Button
        variant="outline"
        size="sm"
        className={inline ? "shrink-0" : "flex-1 sm:flex-none"}
        asChild
      >
        <Link to={`/admin/users/${user.id}/edit`}>Edit</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={Boolean(deleteDisabledReason)}
        title={deleteDisabledReason ?? undefined}
        className={
          inline
            ? "shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            : "flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 sm:flex-none"
        }
        onClick={() => onDelete(user.id)}
      >
        Delete
      </Button>
    </div>
  );
}

export default function UserListPage() {
  const { logout, user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteRequest(id: number) {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const restriction = getUserDeleteRestriction(
      target,
      users,
      currentUser?.username
    );
    if (restriction) {
      showError("Cannot delete user", restriction);
      return;
    }

    setDeleteTarget(target);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      success("User deleted", `${deleteTarget.username} was removed successfully.`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showError(
        "Delete failed",
        err instanceof Error ? err.message : "Failed to delete user."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-background">
      <SiteHeader showAdmin={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage admin and head officer accounts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/admin/scholars">Scholars</Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/">View site</Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={logout}>
              Log out
            </Button>
            <Button className="col-span-2 w-full sm:col-span-1 sm:w-auto" asChild>
              <Link to="/admin/users/new">Add user</Link>
            </Button>
          </div>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && users.length === 0 && (
          <p className="text-muted-foreground">
            No users yet.{" "}
            <Link to="/admin/users/new" className="underline">
              Add one
            </Link>
            .
          </p>
        )}

        {!loading && users.length > 0 && (
          <>
            <div className="space-y-3 md:hidden">
              {users.map((u) => (
                <Card key={u.id} size="sm">
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold">{u.username}</p>
                      <p className="text-sm text-muted-foreground">{u.roleDisplay}</p>
                      <p className="text-sm text-muted-foreground">
                        Region: {u.regionLabel || "All regions"}
                      </p>
                    </div>
                    <UserActions
                      user={u}
                      onDelete={handleDeleteRequest}
                      deleteDisabledReason={getUserDeleteRestriction(
                        u,
                        users,
                        currentUser?.username
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden md:block">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%]">Username</TableHead>
                    <TableHead className="w-[18%]">Role</TableHead>
                    <TableHead className="w-[22%]">Region</TableHead>
                    <TableHead className="w-[38%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="truncate font-medium">{u.username}</TableCell>
                      <TableCell className="truncate">{u.roleDisplay}</TableCell>
                      <TableCell className="truncate">
                        {u.regionLabel || "All regions"}
                      </TableCell>
                      <TableCell>
                        <UserActions
                          user={u}
                          onDelete={handleDeleteRequest}
                          inline
                          deleteDisabledReason={getUserDeleteRestriction(
                            u,
                            users,
                            currentUser?.username
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </main>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete user?"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.username}. This action cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
      <SiteFooter />
    </div>
  );
}
