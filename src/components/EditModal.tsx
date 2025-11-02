"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface Experience {
  id: string;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  location?: string;
  achievements?: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string | null;
  gpa?: number | null;
  description?: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency?: string;
}

type EditableItem = Experience | Education | Skill;

interface EditModalProps {
  type: "experience" | "education" | "skill";
  item: EditableItem;
  onClose: () => void;
  onSave: () => void;
}

export default function EditModal({ type, item, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState(item);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const endpoint =
        type === "experience"
          ? `/api/experiences/${item.id}`
          : type === "education"
          ? `/api/education/${item.id}`
          : `/api/skills/${item.id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string | string[] | number | null | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Edit {type.charAt(0).toUpperCase() + type.slice(1)}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
              {error}
            </div>
          )}

          {type === "experience" && (
            <>
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={(formData as Experience).position}
                  onChange={(e) => updateField("position", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={(formData as Experience).company}
                  onChange={(e) => updateField("company", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={(formData as Experience).location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date (YYYY-MM) *</Label>
                  <Input
                    id="startDate"
                    value={(formData as Experience).startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    placeholder="2020-01"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (YYYY-MM)</Label>
                  <Input
                    id="endDate"
                    value={(formData as Experience).endDate || ""}
                    onChange={(e) => updateField("endDate", e.target.value || null)}
                    placeholder="2023-06 or leave empty"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={(formData as Experience).description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="achievements">Achievements (one per line)</Label>
                <Textarea
                  id="achievements"
                  value={(formData as Experience).achievements?.join("\n") || ""}
                  onChange={(e) =>
                    updateField(
                      "achievements",
                      e.target.value.split("\n").filter((a) => a.trim())
                    )
                  }
                  rows={5}
                  placeholder="Led team of 5 engineers&#10;Increased performance by 40%"
                />
              </div>
            </>
          )}

          {type === "education" && (
            <>
              <div>
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  value={(formData as Education).degree}
                  onChange={(e) => updateField("degree", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="institution">Institution *</Label>
                <Input
                  id="institution"
                  value={(formData as Education).institution}
                  onChange={(e) => updateField("institution", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fieldOfStudy">Field of Study</Label>
                <Input
                  id="fieldOfStudy"
                  value={(formData as Education).fieldOfStudy || ""}
                  onChange={(e) => updateField("fieldOfStudy", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date (YYYY-MM) *</Label>
                  <Input
                    id="startDate"
                    value={(formData as Education).startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    placeholder="2016-09"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (YYYY-MM)</Label>
                  <Input
                    id="endDate"
                    value={(formData as Education).endDate || ""}
                    onChange={(e) => updateField("endDate", e.target.value || null)}
                    placeholder="2020-05"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={(formData as Education).gpa || ""}
                  onChange={(e) =>
                    updateField("gpa", e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={(formData as Education).description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}

          {type === "skill" && (
            <>
              <div>
                <Label htmlFor="name">Skill Name *</Label>
                <Input
                  id="name"
                  value={(formData as Skill).name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={(formData as Skill).category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="technical">Technical</option>
                  <option value="soft">Soft</option>
                  <option value="language">Language</option>
                  <option value="certification">Certification</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="proficiency">Proficiency</Label>
                <select
                  id="proficiency"
                  value={(formData as Skill).proficiency || ""}
                  onChange={(e) => updateField("proficiency", e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Not specified</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
