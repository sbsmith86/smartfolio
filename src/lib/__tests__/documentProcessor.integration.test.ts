import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { extractText } from '../documentProcessor';

const testDir = join(process.cwd(), 'test-uploads-integration');

describe('Document Processor Integration Tests - Phase 1 (Text Extraction Only)', () => {
  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('PDF Processing with pdfjs worker configuration', () => {
    it('should handle worker configuration correctly (workerSrc must be string)', async () => {
      // Create a more realistic minimal PDF
      // This is still minimal but closer to a real PDF structure
      const minimalPdf = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, // newline
        0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // binary comment
        // Object 1: Catalog
        0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 1 0 obj
        0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x20, // <</Type
        0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, // /Catalog
        0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, // /Pages 2
        0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // 0 R>>
        0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
      ]);

      const testPdfPath = join(testDir, 'worker-test.pdf');
      await writeFile(testPdfPath, minimalPdf);

      try {
        // This should not throw "Invalid `workerSrc` type" error
        // because we set workerSrc to empty string, not null
        await extractText(testPdfPath, 'application/pdf');

        // If we get here, the worker configuration is correct
        // The extraction might fail due to invalid PDF structure, but that's ok
        // We're testing that the worker configuration doesn't throw a type error
        expect(true).toBe(true);
      } catch (error) {
        // The error should NOT be about workerSrc type
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain('Invalid `workerSrc` type');

        // It's ok if it fails for other reasons (like invalid PDF structure)
        // We're specifically testing that workerSrc is configured correctly
        console.log('Expected error (not workerSrc type error):', errorMessage);
      } finally {
        await rm(testPdfPath, { force: true });
      }
    });

    it('should verify pdfjs GlobalWorkerOptions is set correctly', async () => {
      // This test verifies the worker configuration at module level
      const testPdfPath = join(testDir, 'config-test.pdf');

      // Create minimal PDF
      const minimalPdf = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A,
      ]);

      await writeFile(testPdfPath, minimalPdf);

      try {
        await extractText(testPdfPath, 'application/pdf');
      } catch (error) {
        // Should not throw type error about workerSrc
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toMatch(/Invalid.*workerSrc.*type/i);
      } finally {
        await rm(testPdfPath, { force: true });
      }
    });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
});
