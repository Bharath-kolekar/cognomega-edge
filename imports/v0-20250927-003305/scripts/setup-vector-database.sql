-- Enable pgvector extension for vector operations (if available)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create enhanced vector embeddings table
CREATE TABLE IF NOT EXISTS vector_embeddings (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    vector REAL[] NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp BIGINT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_timestamp 
ON vector_embeddings(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_usage 
ON vector_embeddings(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_metadata 
ON vector_embeddings USING GIN (metadata);

-- Create conversation memory table
CREATE TABLE IF NOT EXISTS conversation_memory (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    input_text TEXT NOT NULL,
    intent TEXT,
    concepts TEXT[],
    vector_id TEXT REFERENCES vector_embeddings(id),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_session 
ON conversation_memory(session_id, timestamp DESC);

-- Create semantic patterns table for long-term learning
CREATE TABLE IF NOT EXISTS semantic_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type TEXT NOT NULL,
    pattern_data JSONB NOT NULL,
    frequency INTEGER DEFAULT 1,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_semantic_patterns_type 
ON semantic_patterns(pattern_type, frequency DESC);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_vector_embeddings_updated_at 
    BEFORE UPDATE ON vector_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO vector_embeddings (id, text, vector, metadata, timestamp) VALUES
('sample_1', 'Create a responsive navigation menu', ARRAY[0.1, 0.2, 0.3, 0.4, 0.5], '{"intent": "create_component", "concepts": ["responsive", "navigation"]}', EXTRACT(EPOCH FROM NOW()) * 1000),
('sample_2', 'Build a user authentication system', ARRAY[0.2, 0.3, 0.4, 0.5, 0.6], '{"intent": "create_feature", "concepts": ["authentication", "user", "security"]}', EXTRACT(EPOCH FROM NOW()) * 1000),
('sample_3', 'Design a modern dashboard layout', ARRAY[0.3, 0.4, 0.5, 0.6, 0.7], '{"intent": "create_layout", "concepts": ["dashboard", "modern", "design"]}', EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (id) DO NOTHING;
