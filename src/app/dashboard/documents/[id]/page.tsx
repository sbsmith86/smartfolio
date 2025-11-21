"use client";

import { useDefaultUser } from "@/lib/useDefaultUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditModal from "@/components/EditModal";
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
} from "lucide-react";

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

interface DocumentDetails {
  id: string;
  fileName: string;
  documentType: string;
  processed: boolean;
  processingError?: string | null;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
}

export default function DocumentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useDefaultUser();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    type: "experience" | "education" | "skill";
    id: string;
    data: Experience | Education | Skill;
  } | null>(null);

  useEffect(() => {
    params.then(({ id }) => setDocumentId(id));
  }, [params]);

  const fetchDocument = async () => {
    if (!documentId) return;
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) throw new Error("Failed to fetch document");
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const handleDelete = async (
    type: "experience" | "education" | "skill",
    id: string
  ) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const endpoint =
        type === "experience"
          ? `/api/experiences/${id}`
          : type === "education"
          ? `/api/education/${id}`
          : `/api/skills/${id}`;

      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete ${type}`);

      // Refresh document data
      fetchDocument();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/documents")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
        <h1 className="text-3xl font-bold">{document.fileName}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={document.processed ? "default" : "secondary"}>
            {document.processed ? "Processed" : "Not Processed"}
          </Badge>
          <Badge variant="outline">{document.documentType}</Badge>
        </div>
      </div>

      {document.processingError && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error: {document.processingError}</p>
          </CardContent>
        </Card>
      )}

      {/* Experiences */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience ({document.experiences.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {document.experiences.length === 0 ? (
            <p className="text-gray-500">No experiences extracted</p>
          ) : (
            <div className="space-y-4">
              {document.experiences.map((exp) => (
                <Card key={exp.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{exp.position}</h3>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate || "Present"}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="mt-2 text-gray-700">{exp.description}</p>
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                            {exp.achievements.map((achievement, idx) => (
                              <li key={idx}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingItem({ type: "experience", id: exp.id, data: exp })
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete("experience", exp.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education ({document.education.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {document.education.length === 0 ? (
            <p className="text-gray-500">No education extracted</p>
          ) : (
            <div className="space-y-4">
              {document.education.map((edu) => (
                <Card key={edu.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{edu.degree}</h3>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-gray-600">{edu.fieldOfStudy}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {edu.startDate} - {edu.endDate || "Present"}
                          {edu.gpa && ` • GPA: ${edu.gpa}`}
                        </p>
                        {edu.description && (
                          <p className="mt-2 text-gray-700">{edu.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingItem({ type: "education", id: edu.id, data: edu })
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete("education", edu.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills ({document.skills.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {document.skills.length === 0 ? (
            <p className="text-gray-500">No skills extracted</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {document.skills.map((skill) => (
                <Card key={skill.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{skill.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {skill.category}
                          </Badge>
                          {skill.proficiency && (
                            <Badge variant="secondary" className="text-xs">
                              {skill.proficiency}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingItem({ type: "skill", id: skill.id, data: skill })
                          }
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete("skill", skill.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          type={editingItem.type}
          item={editingItem.data}
          onClose={() => setEditingItem(null)}
          onSave={fetchDocument}
        />
      )}
    </div>
  );
}
