# Testing Guide for SmartFolio Document Upload

## Unit Tests

Run the automated unit tests:

```bash
# Run tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Current Test Coverage

- ✅ PDF text extraction functionality
- ✅ DOCX text extraction functionality
- ✅ Unsupported file type validation
- ✅ Environment configuration mocking
- ✅ OpenAI API mocking

## Manual Integration Testing

### Testing Document Upload & Processing

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the documents page:**
   - Sign in to your account
   - Go to Dashboard → Documents (or click "Upload Documents")

3. **Upload a PDF resume:**
   - Drag & drop a PDF file OR click to browse
   - File must be:
     - PDF (.pdf) or DOCX (.docx) format
     - Maximum 10MB in size

4. **Expected behavior:**
   - Upload indicator appears
   - "Processing document..." message shows
   - Success message displays with file name and size
   - Document appears in the list marked as "Processed"

5. **Verify data extraction:**
   After successful upload, check that:
   - Your profile is updated with extracted name, location, bio
   - Skills are added to your profile
   - Experience entries are created
   - Education entries are created
   - Knowledge embeddings are created for chat functionality

### Common Issues & Solutions

#### Issue: "Failed to extract text from document"
**Cause:** The PDF might be corrupted or the worker configuration failed
**Solution:**
- Ensure you restarted the dev server after the latest changes
- Check server logs for detailed error messages
- Try a different PDF file

#### Issue: "Document text extraction failed"
**Cause:** The extractedText field is empty in the database
**Solution:**
- Check that the PDF contains actual text (not just images)
- Verify the file is a valid PDF format

#### Issue: "Processing failed"
**Cause:** OpenAI API key might be invalid or AI processing encountered an error
**Solution:**
- Verify your `.env.local` has a valid `OPENAI_API_KEY`
- Check OpenAI API quota and status
- Review server logs for specific error messages

## Testing Checklist

- [ ] Unit tests pass (`npm test`)
- [ ] PDF upload succeeds
- [ ] DOCX upload succeeds
- [ ] Text extraction completes
- [ ] AI processing extracts data correctly
- [ ] Profile is updated with extracted info
- [ ] Skills are added to database
- [ ] Experience entries are created
- [ ] Education entries are created
- [ ] Knowledge embeddings are created
- [ ] Document appears in documents list
- [ ] "Upload Another" button works
- [ ] Error handling displays properly
- [ ] File size validation works (reject >10MB)
- [ ] File type validation works (reject non-PDF/DOCX)

## Test Files Location

- Unit tests: `src/lib/__tests__/documentProcessor.test.ts`
- Test configuration: `vitest.config.ts`
- Component: `src/components/DocumentUpload.tsx`
- API routes:
  - Upload: `src/app/api/documents/upload/route.ts`
  - Process: `src/app/api/documents/[id]/process/route.ts`
- Core logic: `src/lib/documentProcessor.ts`

## Debugging Tips

1. **Check server logs** for detailed error messages
2. **Use browser DevTools** Network tab to inspect API responses
3. **Verify environment variables** are loaded correctly
4. **Check database** to see if records are being created
5. **Test with simple PDFs first** before complex resumes

## Next Steps

After successful testing:
1. Test with various resume formats and layouts
2. Test with edge cases (very large files, corrupted PDFs, etc.)
3. Monitor OpenAI API usage and costs
4. Consider adding more comprehensive integration tests
5. Add E2E tests with tools like Playwright or Cypress
