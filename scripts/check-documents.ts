#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkDocuments() {
  const docs = await prisma.userDocument.findMany({
    select: {
      id: true,
      fileName: true,
      processed: true,
      processingError: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('📄 Documents in database:\n');
  docs.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.fileName}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Status: ${doc.processingError ? 'FAILED' : doc.processed ? 'SUCCESS' : 'PROCESSING'}`);
    if (doc.processingError) {
      console.log(`   Error: ${doc.processingError}`);
    }
    console.log(`   Created: ${doc.createdAt}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkDocuments();
