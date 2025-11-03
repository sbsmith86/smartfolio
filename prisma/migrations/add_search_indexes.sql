-- Add pgvector IVFFlat index for fast vector similarity search
-- IVFFlat uses inverted file index for approximate nearest neighbor search
-- lists=100 is good for datasets up to ~1M vectors
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector
ON "KnowledgeEmbedding"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add pg_trgm GIN index for fast full-text similarity search
-- This enables fast fuzzy text matching with the similarity() function
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_content_trgm
ON "KnowledgeEmbedding"
USING gin (content gin_trgm_ops);

-- Add composite index for filtered vector search
-- Speeds up queries filtered by userId and contentType
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_user_type
ON "KnowledgeEmbedding" ("userId", "contentType");

-- Analyze table to update query planner statistics
ANALYZE "KnowledgeEmbedding";
