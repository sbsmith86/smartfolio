"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface UploadedDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  processed: boolean;
}

interface DocumentUploadProps {
  onUploadComplete?: (document: UploadedDocument) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
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

      // Start processing
      setProcessing(true);
      const processResult = await processDocument(result.document.id);

      // Update the uploaded file with processed status
      setUploadedFile({ ...result.document, processed: true });
      setSuccess(true);

      onUploadComplete?.(result.document);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);

      // Clear the uploaded file on error so we don't show conflicting messages
      setUploadedFile(null);
    } finally {
      setUploading(false);
      setProcessing(false);
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

  const processDocument = async (documentId: string) => {
    const response = await fetch(`/api/documents/${documentId}/process`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Processing failed');
    }

    return await response.json();
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
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
            {processing ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-amber-600" />
                <div>
                  <p className="font-medium text-gray-800">Processing document...</p>
                  <p className="text-sm text-gray-500">
                    Extracting profile information from your resume
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Document uploaded successfully!</p>
                  <p className="text-sm text-gray-500">{uploadedFile.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(uploadedFile.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button onClick={resetUpload} variant="outline" size="sm" className="mt-4">
                  <X className="h-4 w-4 mr-2" />
                  Upload Another
                </Button>
              </>
            )}
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
