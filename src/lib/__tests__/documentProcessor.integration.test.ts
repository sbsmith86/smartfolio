import { describe, it, expect, vi } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

// Mock environment variables before importing modules
vi.mock('../env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret-key-for-testing-purposes-only',
    NEXTAUTH_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    OPENAI_API_KEY: 'test-openai-api-key',
  },
}));

// Mock OpenAI to avoid real API calls in tests
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  personalInfo: {
                    name: 'Test User',
                    email: 'test@example.com',
                  },
                  summary: 'Test summary',
                  skills: ['JavaScript', 'TypeScript'],
                  experience: [],
                  education: []
                })
              }
            }]
          })
        }
      };
      embeddings = {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }]
        })
      };
    }
  };
});

// Import after mocks are set up
const { extractText } = await import('../documentProcessor');

const testDir = join(process.cwd(), 'test-uploads-integration');

describe('Document Processor Integration Tests', () => {
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
      } catch (error: any) {
        // The error should NOT be about workerSrc type
        expect(error.message).not.toContain('Invalid `workerSrc` type');

        // It's ok if it fails for other reasons (like invalid PDF structure)
        // We're specifically testing that workerSrc is configured correctly
        console.log('Expected error (not workerSrc type error):', error.message);
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
      } catch (error: any) {
        // Should not throw type error about workerSrc
        expect(error.message).not.toMatch(/Invalid.*workerSrc.*type/i);
      } finally {
        await rm(testPdfPath, { force: true });
      }
    });
  });

  describe('Real-world file handling', () => {
    it.skip('should process a real PDF file (requires sample file)', async () => {
      // To run this test, place a real PDF at test-uploads-integration/sample.pdf
      const realPdfPath = join(testDir, 'sample.pdf');

      const text = await extractText(realPdfPath, 'application/pdf');

      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });
  });
});
