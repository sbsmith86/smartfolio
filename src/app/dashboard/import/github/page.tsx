"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";

interface ImportResult {
  success: boolean;
  projectsAdded: number;
  skillsAdded: number;
  embeddingsCreated: number;
  projects?: Array<{ name: string; url: string }>;
  error?: string;
}

export default function GitHubImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter a GitHub username");
      return;
    }

    if (!session?.user?.id) {
      setError("You must be logged in to import");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/github/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          userId: session.user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Import failed with status ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-600 p-3 rounded-xl">
              <Github className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import GitHub Projects</h1>
              <p className="text-gray-600 mt-1">
                Connect your GitHub repositories to enrich your portfolio
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Enter Your GitHub Username</CardTitle>
            <CardDescription>
              We&apos;ll fetch your top 5 most recently updated public repositories and extract project details using AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-semibold">
                  GitHub Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="e.g., sbsmith86"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="text-lg py-6 pl-4 pr-12"
                  />
                  <Github className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Your public GitHub profile username (not your email)
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white font-semibold py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Importing Projects...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Import GitHub Projects
                  </>
                )}
              </Button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Import Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {result && result.success && (
              <div className="mt-6 p-6 bg-green-50 border-l-4 border-green-500 rounded-md">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-800 mb-2">
                      ✅ Import Successful!
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{result.projectsAdded}</p>
                        <p className="text-xs text-gray-600 mt-1">Projects Added</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{result.skillsAdded}</p>
                        <p className="text-xs text-gray-600 mt-1">Skills Added</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{result.embeddingsCreated}</p>
                        <p className="text-xs text-gray-600 mt-1">Embeddings Created</p>
                      </div>
                    </div>

                    {result.projects && result.projects.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">
                          Imported Projects:
                        </h4>
                        <ul className="space-y-2">
                          {result.projects.map((project, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700">
                              <Github className="h-4 w-4 mr-2 text-gray-500" />
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {project.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="flex-1"
                      >
                        Back to Dashboard
                      </Button>
                      <Button
                        onClick={() => router.push(`/profile/${session?.user?.id}`)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        View My Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            What happens during import?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>We fetch your top 5 most recently updated public repositories</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>GPT-4o analyzes each README to extract project details and tech stack</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Projects are added to your experiences with provenance tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Skills are automatically extracted and linked to your profile</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Embeddings are generated for semantic search and AI-powered chat</span>
            </li>
          </ul>
          <p className="text-xs text-blue-700 mt-4 italic">
            Note: Only public repositories are accessible. Private repos require OAuth authentication (coming soon).
          </p>
        </div>
      </main>
    </div>
  );
}
