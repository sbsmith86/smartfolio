import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface AddTestimonialRequest {
  userId: string;
  recommenderName: string;
  recommenderTitle?: string;
  recommenderCompany?: string;
  relationship?: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddTestimonialRequest = await request.json();
    const {
      userId,
      recommenderName,
      recommenderTitle,
      recommenderCompany,
      relationship,
      content,
    } = body;

    // Validation
    if (!userId || !recommenderName || !content) {
      return NextResponse.json(
        { error: "Missing required fields: userId, recommenderName, content" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        userId,
        recommenderName,
        recommenderTitle: recommenderTitle || null,
        recommenderCompany: recommenderCompany || null,
        relationship: relationship || null,
        content,
        verified: false, // Manual entries start as unverified
        public: true, // Default to public
      },
    });

    // Generate embedding for testimonial content using raw SQL
    // (Prisma doesn't support pgvector type natively)
    try {
      const embeddingResponse = await fetch(
        "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: content,
          }),
        }
      );

      if (!embeddingResponse.ok) {
        throw new Error("Failed to generate embedding");
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Insert embedding using raw SQL
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeEmbedding" (
          "userId",
          "contentType",
          "contentId",
          content,
          embedding,
          metadata,
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${userId},
          'testimonial',
          ${testimonial.id},
          ${content},
          ${embedding}::vector,
          ${JSON.stringify({
            recommenderName,
            recommenderTitle,
            recommenderCompany,
            relationship,
          })}::jsonb,
          NOW(),
          NOW()
        )
      `;
    } catch (embeddingError) {
      console.error("Error generating embedding:", embeddingError);
      // Don't fail the whole request if embedding fails
      // The testimonial is still created
    }

    return NextResponse.json(
      {
        success: true,
        testimonial: {
          id: testimonial.id,
          recommenderName: testimonial.recommenderName,
          recommenderTitle: testimonial.recommenderTitle,
          recommenderCompany: testimonial.recommenderCompany,
          relationship: testimonial.relationship,
          content: testimonial.content,
          createdAt: testimonial.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding testimonial:", error);
    return NextResponse.json(
      {
        error: "Failed to add testimonial",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
