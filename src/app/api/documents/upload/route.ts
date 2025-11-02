import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { extractText } from '@/lib/documentProcessor';
import { handleParseResume } from '@/lib/mcp/handlers/ingestion';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum file size is 10MB.' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', session.user.id);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extract text content
    let extractedText = '';
    try {
      extractedText = await extractText(filePath, file.type);
      console.log(`Successfully extracted ${extractedText.length} characters from ${file.name}`);
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      // Don't save document if extraction fails - this is critical for processing
      return NextResponse.json(
        { error: 'Failed to extract text from document. Please ensure the file is not corrupted.' },
        { status: 400 }
      );
    }

    // Save to database
    const document = await prisma.userDocument.create({
      data: {
        userId: session.user.id,
        documentType: documentType || 'resume',
        fileName: file.name,
        filePath,
        fileSize: BigInt(file.size),
        mimeType: file.type,
        extractedText,
        processed: false,
      },
    });

    // Automatically parse resume to create embeddings (background process)
    // Don't await - let it run in background so user gets immediate response
    if (documentType === 'resume' || !documentType) {
      handleParseResume(
        {
          userId: session.user.id,
          documentId: document.id,
        },
        {
          id: `upload-${document.id}`,
          userId: session.user.id,
          createdAt: new Date(),
          lastActivity: new Date(),
          context: new Map(),
        }
      )
        .then((result) => {
          // Mark document as processed and save summary
          return prisma.userDocument.update({
            where: { id: document.id },
            data: {
              processed: true,
              processingError: null,
              processingSummary: result.summary,
            },
          });
        })
        .catch((error) => {          // Save the error so user can see it
          const errorMessage = error instanceof Error ? error.message : 'Processing failed';
          return prisma.userDocument.update({
            where: { id: document.id },
            data: {
              processed: false,
              processingError: errorMessage
            },
          });
        });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        fileSize: Number(document.fileSize),
        processed: document.processed,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.userDocument.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fileName: true,
        documentType: true,
        fileSize: true,
        mimeType: true,
        processed: true,
        processingError: true,
        processingSummary: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      documents: documents.map(doc => ({
        ...doc,
        fileSize: Number(doc.fileSize),
      })),
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
