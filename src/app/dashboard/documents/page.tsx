"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DocumentUpload from "@/components/DocumentUpload";
import {
  Loader2,
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  mimeType: string;
  processed: boolean;
  createdAt: string;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents/upload");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    fetchDocuments();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Document Management
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <Card className="border border-gray-200 bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <FileText className="h-8 w-8 text-amber-600" />
                <span className="font-bold text-gray-800">
                  Upload New Document
                </span>
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Upload your resume or CV to extract profile information and
                create knowledge embeddings for your conversational profile.
              </p>
            </CardHeader>
            <CardContent>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="border border-gray-200 bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">
                  Your Documents
                </span>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {documents.length} {documents.length === 1 ? "file" : "files"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    No documents uploaded yet
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Upload your first document to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <Card
                      key={doc.id}
                      className="border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="bg-amber-100 rounded-lg p-3">
                              <FileText className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 text-lg">
                                {doc.fileName}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>•</span>
                                <span>{formatDate(doc.createdAt)}</span>
                                <span>•</span>
                                <span className="capitalize">
                                  {doc.documentType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {doc.processed ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Processed
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Clock className="h-4 w-4 mr-1" />
                                Processing
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Info Card */}
          <Card className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-800 text-lg mb-2">
                What happens when you upload a document?
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold">1.</span>
                  <span>
                    Your document is uploaded securely and text is extracted
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold">2.</span>
                  <span>
                    AI analyzes the content to extract skills, experience, and
                    education
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold">3.</span>
                  <span>
                    Your profile is automatically updated with the extracted
                    information
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold">4.</span>
                  <span>
                    Knowledge embeddings are created for intelligent chat
                    responses
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
