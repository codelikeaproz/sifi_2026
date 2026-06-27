import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUser,
  getUser,
  getUsers,
  getUserRoleChangeRestriction,
  isOnlyAdminUser,
  REGION_OPTIONS,
  updateUser,
  USER_ROLE_OPTIONS,
  type ManagedUser,
  type Region,
  type UserRole,
} from "@/lib/api";

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [userForm, setUserForm] = useState({
    username: "",
    role: "head_officer" as UserRole,
    region: "mindanao" as Region,
    loadedUser: null as ManagedUser | null,
    allUsers: [] as ManagedUser[],
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getUser(Number(id)), getUsers()])
      .then(([u, users]) => {
        setUserForm({
          username: u.username,
          role: u.role,
          region: u.region ?? "mindanao",
          loadedUser: u,
          allUsers: users,
        });
      })
      .catch(() => setError("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  const roleLocked =
    userForm.loadedUser !== null &&
    isOnlyAdminUser(userForm.loadedUser, userForm.allUsers);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !password) {
      setError("Password is required for new users.");
      return;
    }

    if (userForm.role === "head_officer" && !userForm.region) {
      setError("Region is required for Head Officer.");
      return;
    }

    if (userForm.loadedUser) {
      const roleRestriction = getUserRoleChangeRestriction(
        userForm.loadedUser,
        userForm.allUsers,
        userForm.role
      );
      if (roleRestriction) {
        setError(roleRestriction);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateUser(Number(id), {
          username: userForm.username,
          role: userForm.role,
          region: userForm.role === "admin" ? "" : userForm.region,
          ...(password ? { password } : {}),
        });
      } else {
        await createUser({
          username: userForm.username,
          password,
          role: userForm.role,
          region: userForm.role === "admin" ? "" : userForm.region,
        });
      }
      navigate("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={isEdit ? "Edit user" : "New user"}
      description={
        isEdit
          ? "Update account details. Leave password blank to keep the current one."
          : "Create an admin or regional head officer account."
      }
    >
      <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>{isEdit ? "Edit user" : "New user"}</CardTitle>
            <CardDescription>
              Save account details and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm((current) => ({ ...current, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password{isEdit ? " (optional)" : ""}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEdit}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(v) =>
                    setUserForm((current) => ({ ...current, role: v as UserRole }))
                  }
                  disabled={roleLocked}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={roleLocked && opt.value === "head_officer"}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roleLocked && (
                  <p className="text-sm text-muted-foreground">
                    This is the only admin account. Role must stay Admin.
                  </p>
                )}
              </div>
              {userForm.role === "head_officer" && (
                <div className="space-y-2">
                  <Label htmlFor="region">Assigned region</Label>
                  <Select
                    value={userForm.region}
                    onValueChange={(v) =>
                      setUserForm((current) => ({ ...current, region: v as Region }))
                    }
                  >
                    <SelectTrigger id="region" className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to="/admin/users">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </AdminShell>
  );
}
