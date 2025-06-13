-- Force clean setup - drops and recreates everything safely
-- This will definitely resolve any policy conflicts

-- First, disable RLS temporarily to drop policies
ALTER TABLE IF EXISTS files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analysis_results DISABLE ROW LEVEL SECURITY;

-- Drop all policies (this will work even if they don't exist)
DROP POLICY IF EXISTS "Allow all operations on files" ON files;
DROP POLICY IF EXISTS "Allow all operations on document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow all operations on analysis_results" ON analysis_results;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size BIGINT NOT NULL,
    subject TEXT DEFAULT 'General',
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
    progress INTEGER DEFAULT 0,
    extracted_text TEXT,
    tags TEXT[] DEFAULT '{}',
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('quiz', 'flashcards', 'chat')),
    model_used TEXT NOT NULL,
    analysis_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_file_id ON analysis_results(file_id);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies (now they definitely don't exist)
CREATE POLICY "Allow all operations on files" ON files FOR ALL USING (true);
CREATE POLICY "Allow all operations on document_chunks" ON document_chunks FOR ALL USING (true);
CREATE POLICY "Allow all operations on analysis_results" ON analysis_results FOR ALL USING (true);

-- Insert sample data if tables are empty
INSERT INTO files (name, type, size, subject, status, progress, extracted_text, tags)
SELECT * FROM (VALUES
    (
        'Sample Calculus Document.pdf',
        'application/pdf',
        1024000,
        'Mathematics',
        'completed',
        100,
        'This is a sample calculus document covering integration techniques, derivatives, and applications of calculus in real-world scenarios. Key topics include: Integration by parts, substitution method, partial fractions, and applications to area and volume calculations.',
        ARRAY['calculus', 'mathematics', 'integration', 'derivatives']
    ),
    (
        'Physics Fundamentals.pdf',
        'application/pdf',
        2048000,
        'Physics',
        'completed',
        100,
        'Comprehensive physics document covering mechanics, thermodynamics, waves, and quantum physics principles. Topics include Newtons laws, energy conservation, heat transfer, wave properties, and quantum mechanics basics.',
        ARRAY['physics', 'mechanics', 'thermodynamics', 'waves']
    )
) AS new_data
WHERE NOT EXISTS (SELECT 1 FROM files LIMIT 1);

-- Final verification
SELECT 
    '🎉 Database setup completed successfully!' as status,
    'Tables: ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('files', 'document_chunks', 'analysis_results')) as tables_created,
    'Policies: ' || (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('files', 'document_chunks', 'analysis_results')) as policies_created,
    'Sample files: ' || (SELECT COUNT(*) FROM files) as sample_data;
