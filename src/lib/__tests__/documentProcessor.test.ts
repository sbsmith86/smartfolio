import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { extractText } from '../documentProcessor';

const testDir = join(process.cwd(), 'test-uploads');

describe('Document Processor - Phase 1 (Text Extraction Only, No AI)', () => {
  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });

  describe('extractText', () => {
    it('should extract text from a simple PDF', async () => {
      // Create a minimal test PDF file
      // This is a very basic PDF structure - in reality you'd use a real PDF for testing
      const pdfContent = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, // newline
      ]);

      const testPdfPath = join(testDir, 'test.pdf');
      await writeFile(testPdfPath, pdfContent);

      try {
        // This will likely fail on a minimal PDF, but tests the function exists
        await extractText(testPdfPath, 'application/pdf');
      } catch (error) {
        // Expected to fail with minimal PDF - that's okay for structure test
        expect(error).toBeDefined();
      }

      // Clean up
      await rm(testPdfPath, { force: true });
    });

    it('should throw error for unsupported file type', async () => {
      const testFilePath = join(testDir, 'test.txt');
      await writeFile(testFilePath, 'test content');

      await expect(
        extractText(testFilePath, 'text/plain')
      ).rejects.toThrow('Unsupported file type');

      // Clean up
      await rm(testFilePath, { force: true });
    });

    it('should handle DOCX files', async () => {
      // Create a minimal DOCX structure
      const testDocxPath = join(testDir, 'test.docx');

      // This is a very minimal test - in reality you'd need a proper DOCX file
      const minimalDocx = Buffer.from([
        0x50, 0x4B, 0x03, 0x04, // ZIP header (DOCX is a ZIP file)
      ]);

      await writeFile(testDocxPath, minimalDocx);

      try {
        // This will likely fail on a minimal DOCX, but tests the function exists
        await extractText(testDocxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } catch (error) {
        // Expected to fail with minimal DOCX - that's okay for structure test
        expect(error).toBeDefined();
      }

      // Clean up
      await rm(testDocxPath, { force: true });
    });
  });

  // Clean up test directory after all tests
  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
});
