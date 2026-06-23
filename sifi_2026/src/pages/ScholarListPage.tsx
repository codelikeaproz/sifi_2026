import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { RegionFilter } from "@/components/RegionFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import {
  deleteScholar,
  getScholarsPaginated,
  PAGE_SIZE_OPTIONS,
  type PageSize,
  type PaginatedScholars,
  type RegionFilterValue,
  type Scholar,
} from "@/lib/api";

function ScholarActions({
  scholar,
  onDelete,
  inline = false,
}: {
  scholar: Scholar;
  onDelete: (id: number) => void;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "flex justify-end gap-2" : "flex gap-2"}>
      <Button
        variant="outline"
        size="sm"
        className={inline ? "shrink-0" : "flex-1 sm:flex-none"}
        asChild
      >
        <Link to={`/admin/scholars/${scholar.id}/edit`}>Edit</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={
          inline
            ? "shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
        }
        onClick={() => onDelete(scholar.id)}
      >
        Delete
      </Button>
    </div>
  );
}

export default function ScholarListPage() {
  const { assignedRegion } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [region, setRegion] = useState<RegionFilterValue>(
    assignedRegion ?? "all"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [data, setData] = useState<PaginatedScholars | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Scholar | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (assignedRegion) {
      setRegion(assignedRegion);
    }
  }, [assignedRegion]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await getScholarsPaginated({
          page,
          pageSize,
          search: debouncedSearch,
          region,
        })
      );
    } catch {
      setError("Failed to load scholars");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, region]);

  useEffect(() => {
    load();
  }, [load]);

  const scholars = data?.results ?? [];
  const total = data?.count ?? 0;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrevious = page > 1;
  const hasNext = data?.next != null;

  function handleDeleteRequest(id: number) {
    const target = scholars.find((s) => s.id === id);
    if (!target) return;
    setDeleteTarget(target);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteScholar(deleteTarget.id);
      success(
        "Scholar deleted",
        `${deleteTarget.fullName} was removed successfully.`
      );
      setDeleteTarget(null);

      if (scholars.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete scholar.";
      showError("Delete failed", message);
      if (message.toLowerCase().includes("log in")) {
        navigate("/admin/login");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Scholars"
      description="Create, edit, and delete scholar profiles."
      actions={
        <Button className="w-full sm:w-auto" asChild>
          <Link to="/admin/scholars/new">Add new</Link>
        </Button>
      }
    >
      <div className="space-y-6">

        <RegionFilter
          value={region}
          onChange={(v) => {
            setRegion(v);
            setPage(1);
          }}
          lockedRegion={assignedRegion ?? undefined}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, school, degree…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v) as PageSize);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && total === 0 && !debouncedSearch && (
          <p className="text-muted-foreground">
            No scholars yet.{" "}
            <Link to="/admin/scholars/new" className="underline">
              Add one
            </Link>
            .
          </p>
        )}

        {!loading && !error && total === 0 && debouncedSearch && (
          <p className="text-muted-foreground">No scholars match your search.</p>
        )}

        {!loading && scholars.length > 0 && (
          <>
            <div className="space-y-3 md:hidden">
              {scholars.map((s) => (
                <Card key={s.id} size="sm">
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold">{s.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.schoolName ?? s.school}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.degreeName}</p>
                      <p className="text-sm text-muted-foreground">
                        Region: {s.regionLabel || "—"}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Honor: {s.latinHonorLabel || "—"}</span>
                      <span>Order: {s.order ?? 0}</span>
                    </div>
                    <ScholarActions scholar={s} onDelete={handleDeleteRequest} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden md:block">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[18%]">Full Name</TableHead>
                    <TableHead className="w-[20%]">School</TableHead>
                    <TableHead className="w-[18%]">Degree</TableHead>
                    <TableHead className="w-[10%]">Region</TableHead>
                    <TableHead className="w-[12%]">Latin Honor</TableHead>
                    <TableHead className="w-[6%]">Order</TableHead>
                    <TableHead className="w-[16%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scholars.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="truncate font-medium">{s.fullName}</TableCell>
                      <TableCell className="truncate">{s.schoolName ?? s.school}</TableCell>
                      <TableCell className="truncate">{s.degreeName}</TableCell>
                      <TableCell className="truncate">{s.regionLabel || "—"}</TableCell>
                      <TableCell className="truncate">{s.latinHonorLabel || "—"}</TableCell>
                      <TableCell>{s.order ?? 0}</TableCell>
                      <TableCell>
                        <ScholarActions scholar={s} onDelete={handleDeleteRequest} inline />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Showing {start}–{end} of {total}
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={!hasPrevious}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete scholar?"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.fullName}. This action cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
    </AdminShell>
  );
}
