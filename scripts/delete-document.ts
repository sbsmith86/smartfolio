#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function deleteDocument(documentId: string) {
  console.log(`🗑️  Deleting document ${documentId}...\n`);

  const doc = await prisma.userDocument.findUnique({
    where: { id: documentId },
    select: { fileName: true, filePath: true },
  });

  if (!doc) {
    console.log('❌ Document not found');
    process.exit(1);
  }

  // Delete file from filesystem
  if (fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath);
    console.log(`✅ Deleted file: ${doc.fileName}`);
  }

  // Delete from database
  await prisma.userDocument.delete({
    where: { id: documentId },
  });

  console.log(`✅ Deleted database record\n`);

  await prisma.$disconnect();
}

const docId = process.argv[2];
if (!docId) {
  console.log('Usage: npx tsx scripts/delete-document.ts <document-id>');
  process.exit(1);
}

deleteDocument(docId);
