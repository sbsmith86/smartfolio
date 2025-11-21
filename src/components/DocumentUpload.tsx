'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useDefaultUser } from '@/lib/useDefaultUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, CheckCircle, AlertCircle, X, Eye, Info } from 'lucide-react';

interface UploadedDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  processed: boolean;
  processingError?: string | null;
}

interface DocumentUploadProps {
  onUploadComplete?: (document: UploadedDocument) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const router = useRouter();
  const { data: session } = useDefaultUser();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for document status after upload
  useEffect(() => {
    if (!uploadedFile || uploadedFile.processed || uploadedFile.processingError) {
      return;
    }

    setIsProcessing(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/${uploadedFile.id}/status`);
        if (response.ok) {
          const data = await response.json();
          setUploadedFile(prev => prev ? { ...prev, processed: data.processed, processingError: data.processingError } : null);

          // Stop polling if processed or failed
          if (data.processed || data.processingError) {
            setIsProcessing(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling document status:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [uploadedFile]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadedFile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'resume');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadedFile(result.document);

      // Phase 1: No AI processing yet - just mark upload as successful
      // Phase 2 (Tasks 6-7) will add embedding generation and AI processing
      setUploadedFile({ ...result.document, processed: false }); // Not AI-processed, just uploaded

      onUploadComplete?.(result.document);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);

      // Clear the uploaded file on error so we don't show conflicting messages
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* AI Accuracy Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>AI-powered extraction:</strong> Our AI extracts your professional data with high accuracy, but results may vary slightly.
            You&apos;ll be able to review and edit everything after processing.
          </p>
        </div>

        {!uploadedFile && !error ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-amber-600" />
                <p className="text-gray-700 font-medium">Uploading document...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Drag & drop your PDF or DOCX file, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : uploadedFile && !error ? (
          <div className="text-center space-y-4">
            {uploadedFile.processingError ? (
              <>
                <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                <div>
                  <p className="font-medium text-red-700">Processing failed</p>
                  <p className="text-sm text-gray-500">{uploadedFile.fileName}</p>
                  <p className="text-xs text-red-600 mt-2">{uploadedFile.processingError}</p>
                </div>
              </>
            ) : uploadedFile.processed ? (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Document processed successfully!</p>
                  <p className="text-sm text-gray-500">{uploadedFile.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(uploadedFile.fileSize / 1024).toFixed(2)} KB • Ready for search
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 font-medium">
                      Please review the AI-extracted data
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 mb-3">
                    AI extraction may vary slightly between uploads. Review your profile to ensure all skills, experiences, and education are accurate.
                  </p>
                  <Button
                    onClick={() => {
                      const userId = session?.user?.id || 'me';
                      router.push(`/profile/${userId}`);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review & Edit Profile
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 mx-auto text-amber-600 animate-spin" />
                <div>
                  <p className="font-medium text-amber-700">Processing document...</p>
                  <p className="text-sm text-gray-500">{uploadedFile.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Extracting skills and generating embeddings...
                  </p>
                </div>
              </>
            )}
            <Button onClick={resetUpload} variant="outline" size="sm" className="mt-4">
              <X className="h-4 w-4 mr-2" />
              Upload Another
            </Button>
          </div>
        ) : null}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <Button onClick={resetUpload} variant="outline" size="sm" className="ml-4">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
