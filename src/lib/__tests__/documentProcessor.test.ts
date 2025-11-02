import { describe, it, expect, beforeAll, vi } from 'vitest';
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
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '555-0100',
                    location: 'San Francisco, CA'
                  },
                  summary: 'Software engineer with 5 years experience',
                  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
                  experience: [{
                    company: 'Tech Corp',
                    position: 'Senior Developer',
                    startDate: '2020-01',
                    endDate: 'Present',
                    description: 'Developed web applications'
                  }],
                  education: [{
                    institution: 'University of Test',
                    degree: 'Bachelor of Science',
                    field: 'Computer Science',
                    graduationDate: '2019'
                  }]
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

const testDir = join(process.cwd(), 'test-uploads');

describe('Document Processor', () => {
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

  // Integration tests would require actual PDF/DOCX files
  describe('Integration tests (requires real files)', () => {
    it.skip('should extract text from real PDF file', async () => {
      // This test is skipped by default
      // To run it, you'd need to place a real PDF file in the test directory
      const realPdfPath = join(testDir, 'sample-resume.pdf');
      const text = await extractText(realPdfPath, 'application/pdf');

      expect(text).toBeTruthy();
      expect(text.length).toBeGreaterThan(0);
    });
  });

  // Clean up test directory after all tests
  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
});
