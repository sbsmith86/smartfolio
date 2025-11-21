"use client";

import { useState } from "react";
import { useDefaultUser } from "@/lib/useDefaultUser";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Linkedin, Loader2, CheckCircle2, AlertCircle, Briefcase, GraduationCap, Award } from "lucide-react";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  experiencesAdded?: number;
  educationAdded?: number;
  skillsAdded?: number;
  embeddingsCreated?: number;
  errors?: string[];
  error?: string;
}

export default function LinkedInImportPage() {
  const { data: session } = useDefaultUser();
  const router = useRouter();
  const [profileText, setProfileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!profileText.trim()) {
      setError("Please paste your LinkedIn profile text");
      return;
    }

    if (!session?.user?.id) {
      setError("You must be logged in to import LinkedIn data");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/linkedin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileText: profileText.trim(),
          userId: session.user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import LinkedIn profile");
      }

            // Check if all imports failed
      const totalImported = (data.experiencesAdded || 0) + (data.educationAdded || 0) + (data.skillsAdded || 0);

      if (totalImported === 0 && data.errors && data.errors.length > 0) {
        // Check if all were duplicates
        const allDuplicates = data.errors.every((err: string) => err.includes("Skipped duplicate"));

        if (allDuplicates) {
          setError("All items were already in your profile. No duplicates were added.");
        } else {
          // All items failed - show as error
          setError(`Import failed: ${data.errors.join(", ")}`);
        }
      } else {
        // At least some items succeeded
        setResult(data);
        if (data.success && totalImported > 0) {
          // Clear the textarea on success
          setProfileText("");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Linkedin className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import LinkedIn Profile</h1>
              <p className="text-gray-600">Paste your LinkedIn profile text to extract experiences, education, and skills</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Instructions */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              How to Get Your LinkedIn Profile Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to your LinkedIn profile page</li>
              <li>Click &quot;More&quot; in your profile header</li>
              <li>Select &quot;Save to PDF&quot;</li>
              <li>Open the PDF and copy all the text (Cmd/Ctrl + A, then Cmd/Ctrl + C)</li>
              <li>Paste the text in the box below</li>
            </ol>
            <p className="text-sm text-gray-600 mt-3">
              <strong>Note:</strong> Your data is processed securely and only visible to you.
            </p>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {result?.success && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Successfully Imported!</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">{result.experiencesAdded || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Experiences</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                  <div className="text-2xl font-bold text-gray-900">{result.educationAdded || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Education</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-purple-600" />
                  <div className="text-2xl font-bold text-gray-900">{result.skillsAdded || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Skills</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🧠</span>
                  <div className="text-2xl font-bold text-gray-900">{result.embeddingsCreated || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Embeddings</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  {result.errors.some(e => e.includes("Skipped duplicate"))
                    ? "Some items were skipped:"
                    : "Some items couldn't be processed:"}
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  {result.errors.map((err, idx) => (
                    <li key={idx} className={err.includes("Skipped duplicate") ? "text-blue-700" : "text-yellow-800"}>
                      {err}
                    </li>
                  ))}
                </ul>
                {result.errors.some(e => e.includes("Skipped duplicate")) && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Duplicates are detected by matching company, position, and start date (or institution + degree for education)
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => router.push(`/profile/${session?.user?.id}`)} className="bg-green-600 hover:bg-green-700">
                View My Profile
              </Button>
            </div>
          </div>
        )}

        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Paste Your LinkedIn Profile</CardTitle>
            <CardDescription>
              We&apos;ll use AI to automatically extract your work experience, education, and skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profileText">LinkedIn Profile Text</Label>
              <Textarea
                id="profileText"
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Paste your complete LinkedIn profile text here...

Example:
John Doe
Software Engineer at TechCorp
San Francisco, CA

Experience:
Software Engineer
TechCorp
Jan 2020 - Present
• Led development of microservices architecture
• Mentored junior developers
..."
                className="mt-2 min-h-[400px] font-mono text-sm"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                {profileText.length} characters
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={loading || !profileText.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-5 w-5" />
                  Import LinkedIn Profile
                </>
              )}
            </Button>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">What happens next?</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• AI analyzes your profile text to extract structured data</li>
                <li>• Work experiences are added to your professional timeline</li>
                <li>• Education records are saved and displayed on your profile</li>
                <li>• Skills are automatically categorized (technical, soft, languages, etc.)</li>
                <li>• Embeddings are generated for semantic search capabilities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
