import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ReferenceAutocomplete } from "@/components/ReferenceAutocomplete";
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
} from "@/lib/api";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteLogo } from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

export default function ScholarFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { assignedRegion } = useAuth();
  const { success, error: showError } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [suffix, setSuffix] = useState("");
  const [school, setSchool] = useState("");
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [degreeName, setDegreeName] = useState("");
  const [degreeId, setDegreeId] = useState<number | null>(null);
  const [region, setRegion] = useState<Region>(assignedRegion ?? "mindanao");
  const [latinHonor, setLatinHonor] = useState<string>("none");
  const [message, setMessage] = useState("");
  const [yearGraduated, setYearGraduated] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [schoolOptions, setSchoolOptions] = useState<ReferenceRecord[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<ReferenceRecord[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionValue = assignedRegion ?? region;
  const debouncedSchoolSearch = useDebounce(school, 200);
  const debouncedDegreeSearch = useDebounce(degreeName, 200);

  useEffect(() => {
    if (!id) return;
    getScholar(Number(id))
      .then((s) => {
        setFirstName(s.first_name);
        setLastName(s.last_name);
        setMiddleInitial(s.middle_initial ?? "");
        setSuffix(s.suffix ?? "");
        setSchool(s.schoolName ?? s.school ?? "");
        setSchoolId(s.schoolRefId ?? null);
        setDegreeName(s.degreeName);
        setDegreeId(s.degreeRefId ?? null);
        if (s.region) setRegion(s.region);
        setLatinHonor(fromLatinHonorValue(s.latinHonor ?? ""));
        setMessage(s.message);
        setYearGraduated(s.year_graduated ? String(s.year_graduated) : "");
        setCurrentImageUrl(s.imageSrc);
      })
      .catch(() => setError("Failed to load scholar"))
      .finally(() => setLoading(false));
  }, [id]);

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
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("middle_initial", middleInitial);
    formData.append("suffix", suffix);
    if (schoolId) formData.append("school_id", String(schoolId));
    formData.append("school", school);
    if (degreeId) formData.append("degree_id", String(degreeId));
    formData.append("degree_name", degreeName);
    formData.append("region", regionValue);
    formData.append("latin_honor", toLatinHonorValue(latinHonor));
    formData.append("message", message);
    if (yearGraduated.trim()) {
      formData.append("year_graduated", yearGraduated.trim());
    }
    if (image) formData.append("image", image);

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateScholar(Number(id), formData);
      } else {
        await createScholar(formData);
      }
      const displayName = [firstName, middleInitial, lastName, suffix]
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
      <div className="flex min-h-svh flex-col bg-background">
        <main className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading…
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main className="flex flex-1 flex-col items-center p-4 sm:p-6">
      <div className="mb-6">
        <SiteLogo className="h-10 w-auto md:h-12" />
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{isEdit ? "Edit scholar" : "New scholar"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update fields below. Leave photo empty to keep the current one."
              : "Add graduation photo and scholar details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="middle_initial">Middle Initial</Label>
                <Input
                  id="middle_initial"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  placeholder="M."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="Jr., III"
                />
              </div>
            </div>
            <div className="space-y-2">
              <ReferenceAutocomplete
                id="school"
                label="School / University"
                value={school}
                onValueChange={(value) => {
                  setSchool(value);
                  setSchoolId(null);
                }}
                onSelectOption={(option) => {
                  setSchool(option.name);
                  setSchoolId(option.id);
                }}
                selectedId={schoolId}
                options={schoolOptions}
                loading={loadingSchools}
                placeholder="University of the Philippines"
                helperText="Search existing schools in this region. Typing a new name will add it when you save."
                required
              />
            </div>
            <div className="space-y-2">
              <ReferenceAutocomplete
                id="degree_name"
                label="Degree Name"
                value={degreeName}
                onValueChange={(value) => {
                  setDegreeName(value);
                  setDegreeId(null);
                }}
                onSelectOption={(option) => {
                  setDegreeName(option.name);
                  setDegreeId(option.id);
                }}
                selectedId={degreeId}
                options={degreeOptions}
                loading={loadingDegrees}
                placeholder="Bachelor of Information Technology"
                helperText="Search existing degrees in this region. Typing a new name will add it when you save."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_graduated">Year Graduated</Label>
              <Input
                id="year_graduated"
                type="number"
                inputMode="numeric"
                min="1900"
                max="2100"
                value={yearGraduated}
                onChange={(e) => setYearGraduated(e.target.value)}
                placeholder="2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={regionValue}
                onValueChange={(v) => {
                  setRegion(v as Region);
                  setSchoolId(null);
                  setDegreeId(null);
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
                value={latinHonor}
                onValueChange={setLatinHonor}
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
            <div className="space-y-2">
              <Label htmlFor="message">Message / Quote</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">
                Graduation Photo{isEdit ? " (optional)" : ""}
              </Label>
              {currentImageUrl && (
                <img
                  src={currentImageUrl}
                  alt="Current graduation photo"
                  className="mb-2 h-32 w-24 rounded-md object-cover"
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/admin/scholars">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
