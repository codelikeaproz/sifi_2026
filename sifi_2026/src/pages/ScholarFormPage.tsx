import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
  LATIN_HONOR_OPTIONS,
  REGION_OPTIONS,
  toLatinHonorValue,
  updateScholar,
  type Region,
} from "@/lib/api";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteLogo } from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthContext";

export default function ScholarFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { assignedRegion } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [suffix, setSuffix] = useState("");
  const [school, setSchool] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [region, setRegion] = useState<Region>(assignedRegion ?? "mindanao");
  const [latinHonor, setLatinHonor] = useState<string>("none");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignedRegion) {
      setRegion(assignedRegion);
    }
  }, [assignedRegion]);

  useEffect(() => {
    if (!id) return;
    getScholar(Number(id))
      .then((s) => {
        setFirstName(s.first_name);
        setLastName(s.last_name);
        setMiddleInitial(s.middle_initial ?? "");
        setSuffix(s.suffix ?? "");
        setSchool(s.schoolName ?? s.school ?? "");
        setDegreeName(s.degreeName);
        if (s.region) setRegion(s.region);
        setLatinHonor(fromLatinHonorValue(s.latinHonor ?? ""));
        setMessage(s.message);
        setCurrentImageUrl(s.imageSrc);
      })
      .catch(() => setError("Failed to load scholar"))
      .finally(() => setLoading(false));
  }, [id]);

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
    formData.append("school", school);
    formData.append("degree_name", degreeName);
    formData.append("region", region);
    formData.append("latin_honor", toLatinHonorValue(latinHonor));
    formData.append("message", message);
    if (image) formData.append("image", image);

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateScholar(Number(id), formData);
      } else {
        await createScholar(formData);
      }
      navigate("/admin/scholars");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
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
              <Label htmlFor="school">School / University</Label>
              <Input
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="University of the Philippines"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree_name">Degree Name</Label>
              <Input
                id="degree_name"
                value={degreeName}
                onChange={(e) => setDegreeName(e.target.value)}
                placeholder="Bachelor of Information Technology"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={region}
                onValueChange={(v) => setRegion(v as Region)}
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
