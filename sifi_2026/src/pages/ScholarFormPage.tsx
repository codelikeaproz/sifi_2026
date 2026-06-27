import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AdminShell } from "@/components/AdminShell";
import { ReferenceAutocomplete } from "@/components/ReferenceAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createScholar,
  fromLatinHonorValue,
  getScholar,
  listDegrees,
  listSchools,
  LATIN_HONOR_OPTIONS,
  REGION_OPTIONS,
  toLatinHonorValue,
  updateScholar,
  type ReferenceRecord,
  type Region,
  type Scholar,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

type ScholarFields = {
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  school: string;
  schoolId: number | null;
  degreeName: string;
  degreeId: number | null;
  region: Region;
  latinHonor: string;
  message: string;
  yearGraduated: string;
  currentImageUrl: string | null;
};

function createEmptyScholarFields(defaultRegion: Region): ScholarFields {
  return {
    firstName: "",
    lastName: "",
    middleInitial: "",
    suffix: "",
    school: "",
    schoolId: null,
    degreeName: "",
    degreeId: null,
    region: defaultRegion,
    latinHonor: "none",
    message: "",
    yearGraduated: "",
    currentImageUrl: null,
  };
}

function scholarToFields(s: Scholar, defaultRegion: Region): ScholarFields {
  return {
    firstName: s.first_name,
    lastName: s.last_name,
    middleInitial: s.middle_initial ?? "",
    suffix: s.suffix ?? "",
    school: s.schoolName ?? s.school ?? "",
    schoolId: s.schoolRefId ?? null,
    degreeName: s.degreeName,
    degreeId: s.degreeRefId ?? null,
    region: s.region ?? defaultRegion,
    latinHonor: fromLatinHonorValue(s.latinHonor ?? ""),
    message: s.message,
    yearGraduated: s.year_graduated ? String(s.year_graduated) : "",
    currentImageUrl: s.imageSrc,
  };
}

export default function ScholarFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { assignedRegion } = useAuth();
  const { success, error: showError } = useToast();
  const defaultRegion = assignedRegion ?? "mindanao";

  const [fields, setFields] = useState<ScholarFields>(() =>
    createEmptyScholarFields(defaultRegion)
  );
  const [image, setImage] = useState<File | null>(null);
  const [schoolOptions, setSchoolOptions] = useState<ReferenceRecord[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<ReferenceRecord[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionValue = assignedRegion ?? fields.region;
  const debouncedSchoolSearch = useDebounce(fields.school, 200);
  const debouncedDegreeSearch = useDebounce(fields.degreeName, 200);

  useEffect(() => {
    if (!id) return;
    getScholar(Number(id))
      .then((s) => {
        setFields(scholarToFields(s, defaultRegion));
      })
      .catch(() => setError("Failed to load scholar"))
      .finally(() => setLoading(false));
  }, [defaultRegion, id]);

  useEffect(() => {
    let cancelled = false;
    async function loadSchoolOptions() {
      setLoadingSchools(true);
      try {
        const records = await listSchools({
          region: regionValue,
          search: debouncedSchoolSearch,
        });
        if (!cancelled) setSchoolOptions(records);
      } catch {
        if (!cancelled) setSchoolOptions([]);
      } finally {
        if (!cancelled) setLoadingSchools(false);
      }
    }
    void loadSchoolOptions();

    return () => {
      cancelled = true;
    };
  }, [regionValue, debouncedSchoolSearch]);

  useEffect(() => {
    let cancelled = false;
    async function loadDegreeOptions() {
      setLoadingDegrees(true);
      try {
        const records = await listDegrees({
          region: regionValue,
          search: debouncedDegreeSearch,
        });
        if (!cancelled) setDegreeOptions(records);
      } catch {
        if (!cancelled) setDegreeOptions([]);
      } finally {
        if (!cancelled) setLoadingDegrees(false);
      }
    }
    void loadDegreeOptions();

    return () => {
      cancelled = true;
    };
  }, [regionValue, debouncedDegreeSearch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !image) {
      setError("Please select a graduation photo.");
      return;
    }

    const formData = new FormData();
    formData.append("first_name", fields.firstName);
    formData.append("last_name", fields.lastName);
    formData.append("middle_initial", fields.middleInitial);
    formData.append("suffix", fields.suffix);
    if (fields.schoolId) formData.append("school_id", String(fields.schoolId));
    formData.append("school", fields.school);
    if (fields.degreeId) formData.append("degree_id", String(fields.degreeId));
    formData.append("degree_name", fields.degreeName);
    formData.append("region", regionValue);
    formData.append("latin_honor", toLatinHonorValue(fields.latinHonor));
    formData.append("message", fields.message);
    if (fields.yearGraduated.trim()) {
      formData.append("year_graduated", fields.yearGraduated.trim());
    }
    if (image) formData.append("image", image);

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateScholar(Number(id), formData);
      } else {
        await createScholar(formData);
      }
      const displayName = [
        fields.firstName,
        fields.middleInitial,
        fields.lastName,
        fields.suffix,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      success(
        isEdit ? "Scholar updated" : "Scholar created",
        `${displayName} was saved successfully.`
      );
      navigate("/admin/scholars");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      showError("Save failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AdminShell contentClassName="max-w-2xl">
        <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      contentClassName="max-w-2xl"
      title={isEdit ? "Edit scholar" : "New scholar"}
      description={
        isEdit
          ? "Update fields below. Leave photo empty to keep the current one."
          : "Add graduation photo and scholar details."
      }
    >
      <Card className="w-full">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection title="Personal details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={fields.firstName}
                    onChange={(e) =>
                      setFields((current) => ({ ...current, firstName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={fields.lastName}
                    onChange={(e) =>
                      setFields((current) => ({ ...current, lastName: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="middle_initial">Middle Initial</Label>
                  <Input
                    id="middle_initial"
                    value={fields.middleInitial}
                    onChange={(e) =>
                      setFields((current) => ({
                        ...current,
                        middleInitial: e.target.value,
                      }))
                    }
                    placeholder="M."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    value={fields.suffix}
                    onChange={(e) =>
                      setFields((current) => ({ ...current, suffix: e.target.value }))
                    }
                    placeholder="Jr., III"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Education">
              <ReferenceAutocomplete
                id="school"
                label="School / University"
                value={fields.school}
                onValueChange={(value) => {
                  setFields((current) => ({
                    ...current,
                    school: value,
                    schoolId: null,
                  }));
                }}
                onSelectOption={(option) => {
                  setFields((current) => ({
                    ...current,
                    school: option.name,
                    schoolId: option.id,
                  }));
                }}
                selectedId={fields.schoolId}
                options={schoolOptions}
                loading={loadingSchools}
                placeholder="University of the Philippines"
                helperText="Search existing schools in this region. Typing a new name will add it when you save."
                required
              />
              <ReferenceAutocomplete
                id="degree_name"
                label="Degree Name"
                value={fields.degreeName}
                onValueChange={(value) => {
                  setFields((current) => ({
                    ...current,
                    degreeName: value,
                    degreeId: null,
                  }));
                }}
                onSelectOption={(option) => {
                  setFields((current) => ({
                    ...current,
                    degreeName: option.name,
                    degreeId: option.id,
                  }));
                }}
                selectedId={fields.degreeId}
                options={degreeOptions}
                loading={loadingDegrees}
                placeholder="Bachelor of Information Technology"
                helperText="Search existing degrees in this region. Typing a new name will add it when you save."
                required
              />
              <div className="space-y-2 sm:max-w-40">
                <Label htmlFor="year_graduated">Year Graduated</Label>
                <Input
                  id="year_graduated"
                  type="number"
                  inputMode="numeric"
                  min="1900"
                  max="2100"
                  value={fields.yearGraduated}
                  onChange={(e) =>
                    setFields((current) => ({
                      ...current,
                      yearGraduated: e.target.value,
                    }))
                  }
                  placeholder="2026"
                />
              </div>
            </FormSection>

            <FormSection title="Region & honors">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={regionValue}
                    onValueChange={(v) => {
                      setFields((current) => ({
                        ...current,
                        region: v as Region,
                        schoolId: null,
                        degreeId: null,
                      }));
                    }}
                    disabled={Boolean(assignedRegion)}
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
                <div className="space-y-2">
                  <Label htmlFor="latin_honor">Latin Honor</Label>
                  <Select
                    value={fields.latinHonor}
                    onValueChange={(value) =>
                      setFields((current) => ({ ...current, latinHonor: value }))
                    }
                  >
                    <SelectTrigger id="latin_honor" className="w-full">
                      <SelectValue placeholder="Select honor" />
                    </SelectTrigger>
                    <SelectContent>
                      {LATIN_HONOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Profile">
              <div className="space-y-2">
                <Label htmlFor="message">Message / Quote</Label>
                <Textarea
                  id="message"
                  value={fields.message}
                  onChange={(e) =>
                    setFields((current) => ({ ...current, message: e.target.value }))
                  }
                  required
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">
                  Graduation Photo{isEdit ? " (optional)" : ""}
                </Label>
                {fields.currentImageUrl && (
                  <img
                    src={fields.currentImageUrl}
                    alt="Current graduation portrait of scholar"
                    className="h-32 w-24 rounded-md object-cover"
                  />
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  required={!isEdit}
                />
              </div>
            </FormSection>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/admin/scholars">Cancel</Link>
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
