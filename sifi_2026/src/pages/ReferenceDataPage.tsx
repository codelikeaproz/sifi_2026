import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import {
  createDegree,
  createSchool,
  deleteDegree,
  deleteSchool,
  listDegrees,
  listSchools,
  REGION_OPTIONS,
  type ReferenceRecord,
  type Region,
  updateDegree,
  updateSchool,
} from "@/lib/api";

type ReferenceSectionProps = {
  kind: "school" | "degree";
  title: string;
  records: ReferenceRecord[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  createValue: string;
  onCreateValueChange: (value: string) => void;
  onCreate: () => Promise<void>;
  editingId: number | null;
  editingValue: string;
  onEditStart: (record: ReferenceRecord) => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
  onEditSave: () => Promise<void>;
  onDeleteRequest: (record: ReferenceRecord) => void;
};

function ReferenceSection({
  kind,
  title,
  records,
  loading,
  search,
  onSearchChange,
  createValue,
  onCreateValueChange,
  onCreate,
  editingId,
  editingValue,
  onEditStart,
  onEditCancel,
  onEditValueChange,
  onEditSave,
  onDeleteRequest,
}: ReferenceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${title}-new`}>Add new</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${title}-new`}
              value={createValue}
              onChange={(e) => onCreateValueChange(e.target.value)}
              placeholder={`Add a ${title.toLowerCase().slice(0, -1)}`}
            />
            <Button type="button" onClick={() => void onCreate()} className="sm:w-auto">
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${title}-search`}>Search</Label>
          <Input
            id={`${title}-search`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
          />
        </div>

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="rounded-md border border-border p-3"
              >
                {editingId === record.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={editingValue}
                      onChange={(e) => onEditValueChange(e.target.value)}
                    />
                    <Button type="button" onClick={() => void onEditSave()}>
                      Save
                    </Button>
                    <Button type="button" variant="outline" onClick={onEditCancel}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{record.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Used by {record.scholarCount ?? 0} scholar
                        {(record.scholarCount ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Rename ${kind} ${record.name}`}
                        title={`Rename ${record.name}`}
                        onClick={() => onEditStart(record)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={
                          record.scholarCount
                            ? `Cannot delete ${kind} ${record.name} because it is in use`
                            : `Delete ${kind} ${record.name}`
                        }
                        title={
                          record.scholarCount
                            ? "Delete is only available when unused"
                            : `Delete ${record.name}`
                        }
                        disabled={(record.scholarCount ?? 0) > 0}
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:text-muted-foreground"
                        onClick={() => onDeleteRequest(record)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReferenceDataPage() {
  const { assignedRegion } = useAuth();
  const { success, error: showError } = useToast();

  const [region, setRegion] = useState<Region>(assignedRegion ?? "mindanao");

  const [schoolSearch, setSchoolSearch] = useState("");
  const [degreeSearch, setDegreeSearch] = useState("");
  const debouncedSchoolSearch = useDebounce(schoolSearch, 200);
  const debouncedDegreeSearch = useDebounce(degreeSearch, 200);

  const [schools, setSchools] = useState<ReferenceRecord[]>([]);
  const [degrees, setDegrees] = useState<ReferenceRecord[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingDegrees, setLoadingDegrees] = useState(true);

  const [newSchoolName, setNewSchoolName] = useState("");
  const [newDegreeName, setNewDegreeName] = useState("");

  const [editingSchoolId, setEditingSchoolId] = useState<number | null>(null);
  const [editingSchoolName, setEditingSchoolName] = useState("");
  const [editingDegreeId, setEditingDegreeId] = useState<number | null>(null);
  const [editingDegreeName, setEditingDegreeName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "school"; record: ReferenceRecord }
    | { kind: "degree"; record: ReferenceRecord }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      setSchools(await listSchools({ region, search: debouncedSchoolSearch }));
    } catch (err) {
      showError("Failed to load schools", err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoadingSchools(false);
    }
  }, [debouncedSchoolSearch, region, showError]);

  const loadDegrees = useCallback(async () => {
    setLoadingDegrees(true);
    try {
      setDegrees(await listDegrees({ region, search: debouncedDegreeSearch }));
    } catch (err) {
      showError("Failed to load degrees", err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoadingDegrees(false);
    }
  }, [debouncedDegreeSearch, region, showError]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadDegrees();
  }, [loadDegrees]);

  async function handleCreateSchool() {
    const name = newSchoolName.trim();
    if (!name) return;
    try {
      await createSchool({ name, region });
      success("School added", `${name} is ready to use.`);
      setNewSchoolName("");
      await loadSchools();
    } catch (err) {
      showError("Failed to add school", err instanceof Error ? err.message : "Request failed");
    }
  }

  async function handleCreateDegree() {
    const name = newDegreeName.trim();
    if (!name) return;
    try {
      await createDegree({ name, region });
      success("Degree added", `${name} is ready to use.`);
      setNewDegreeName("");
      await loadDegrees();
    } catch (err) {
      showError("Failed to add degree", err instanceof Error ? err.message : "Request failed");
    }
  }

  async function handleRenameSchool() {
    if (!editingSchoolId || !editingSchoolName.trim()) return;
    try {
      await updateSchool(editingSchoolId, { name: editingSchoolName.trim(), region });
      success("School renamed", "The school name was updated.");
      setEditingSchoolId(null);
      setEditingSchoolName("");
      await loadSchools();
    } catch (err) {
      showError("Failed to rename school", err instanceof Error ? err.message : "Request failed");
    }
  }

  async function handleRenameDegree() {
    if (!editingDegreeId || !editingDegreeName.trim()) return;
    try {
      await updateDegree(editingDegreeId, { name: editingDegreeName.trim(), region });
      success("Degree renamed", "The degree name was updated.");
      setEditingDegreeId(null);
      setEditingDegreeName("");
      await loadDegrees();
    } catch (err) {
      showError("Failed to rename degree", err instanceof Error ? err.message : "Request failed");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      if (deleteTarget.kind === "school") {
        await deleteSchool(deleteTarget.record.id);
        success("School deleted", `${deleteTarget.record.name} was removed.`);
        await loadSchools();
      } else {
        await deleteDegree(deleteTarget.record.id);
        success("Degree deleted", `${deleteTarget.record.name} was removed.`);
        await loadDegrees();
      }
      setDeleteTarget(null);
    } catch (err) {
      showError(
        "Delete failed",
        err instanceof Error ? err.message : "Request failed"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Schools and Degrees"
      description="Create and rename reusable reference data for scholar entries."
    >
      <div className="space-y-6">

        <div className="flex flex-wrap gap-1.5">
          {(assignedRegion
            ? REGION_OPTIONS.filter((option) => option.value === assignedRegion)
            : REGION_OPTIONS
          ).map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={region === option.value ? "default" : "outline"}
              className="rounded-full px-3"
              disabled={Boolean(assignedRegion)}
              onClick={() => setRegion(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReferenceSection
            kind="school"
            title="Schools"
            records={schools}
            loading={loadingSchools}
            search={schoolSearch}
            onSearchChange={setSchoolSearch}
            createValue={newSchoolName}
            onCreateValueChange={setNewSchoolName}
            onCreate={handleCreateSchool}
            editingId={editingSchoolId}
            editingValue={editingSchoolName}
            onEditStart={(record) => {
              setEditingSchoolId(record.id);
              setEditingSchoolName(record.name);
            }}
            onEditCancel={() => {
              setEditingSchoolId(null);
              setEditingSchoolName("");
            }}
            onEditValueChange={setEditingSchoolName}
            onEditSave={handleRenameSchool}
            onDeleteRequest={(record) => setDeleteTarget({ kind: "school", record })}
          />

          <ReferenceSection
            kind="degree"
            title="Degrees"
            records={degrees}
            loading={loadingDegrees}
            search={degreeSearch}
            onSearchChange={setDegreeSearch}
            createValue={newDegreeName}
            onCreateValueChange={setNewDegreeName}
            onCreate={handleCreateDegree}
            editingId={editingDegreeId}
            editingValue={editingDegreeName}
            onEditStart={(record) => {
              setEditingDegreeId(record.id);
              setEditingDegreeName(record.name);
            }}
            onEditCancel={() => {
              setEditingDegreeId(null);
              setEditingDegreeName("");
            }}
            onEditValueChange={setEditingDegreeName}
            onEditSave={handleRenameDegree}
            onDeleteRequest={(record) => setDeleteTarget({ kind: "degree", record })}
          />
        </div>
      </div>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.kind ?? "record"}?`}
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.record.name}. This action cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
    </AdminShell>
  );
}
