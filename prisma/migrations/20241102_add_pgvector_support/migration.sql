-- AlterTable: Change embedding column from Float[] to vector(1536)
ALTER TABLE "knowledge_embeddings"
ALTER COLUMN "embedding" TYPE vector(1536) USING embedding::text::vector(1536);
