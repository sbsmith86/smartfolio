import mammoth from 'mammoth';
import { readFile } from 'fs/promises';

/**
 * Phase 1: Text Extraction Only (No AI)
 *
 * Extracts plain text from PDF and DOCX files using standard parsing libraries.
 * No AI processing - that happens in Phase 2 (Tasks 6-7) with Tiger MCP integration.
 *
 * Libraries used:
 * - pdf-parse: Parses PDF files, extracts text
 * - mammoth: Parses DOCX files, extracts text
 *
 * Neither library uses AI - they just parse file formats.
 */

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  const buffer = await readFile(filePath);

  if (mimeType === 'application/pdf') {
    // Dynamic import of pdf-parse
    const { PDFParse } = await import('pdf-parse');

    // Set up GlobalWorkerOptions to point to a valid worker
    // Must be set before creating PDFParse instance
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // IMPORTANT: Must use string literal, checking the property can cause issues
    const workerPath: string = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjs as any).GlobalWorkerOptions.workerSrc = workerPath;

    // Convert Buffer to Uint8Array as required by pdf-parse
    const uint8Array = new Uint8Array(buffer);

    // Create parser with the data
    const pdfParser = new PDFParse({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const result = await pdfParser.getText();
    return result.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error('Unsupported file type');
}

/**
 * Phase 2 Functions (Not Yet Implemented)
 *
 * The following functions will be implemented in Phase 2 (Tasks 6-7)
 * when Tiger MCP and OpenAI integration are added:
 *
 * - processResumeWithAI(): Extract structured data from resume text using AI
 * - createKnowledgeEmbeddings(): Generate vector embeddings for conversational search
 *
 * These are currently commented out as they depend on OpenAI SDK which
 * is not installed until Phase 2.
 */
