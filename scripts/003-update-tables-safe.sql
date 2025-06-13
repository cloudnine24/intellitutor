-- Safe update script that handles existing tables and policies
-- This script will only create what doesn't already exist

-- Check if tables exist and create only if they don't
DO $$ 
BEGIN
    -- Create files table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'files') THEN
        CREATE TABLE files (
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
    END IF;

    -- Create document_chunks table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_chunks') THEN
        CREATE TABLE document_chunks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            file_id UUID REFERENCES files(id) ON DELETE CASCADE,
            chunk_text TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Create analysis_results table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analysis_results') THEN
        CREATE TABLE analysis_results (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            file_id UUID REFERENCES files(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL CHECK (action_type IN ('quiz', 'flashcards', 'chat')),
            model_used TEXT NOT NULL,
            analysis_text TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_file_id ON analysis_results(file_id);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    -- Enable RLS on files table
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'files' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE files ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on document_chunks table
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'document_chunks' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on analysis_results table
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'analysis_results' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Create policy for files table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'files' AND policyname = 'Allow all operations on files'
    ) THEN
        CREATE POLICY "Allow all operations on files" ON files FOR ALL USING (true);
    END IF;

    -- Create policy for document_chunks table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_chunks' AND policyname = 'Allow all operations on document_chunks'
    ) THEN
        CREATE POLICY "Allow all operations on document_chunks" ON document_chunks FOR ALL USING (true);
    END IF;

    -- Create policy for analysis_results table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analysis_results' AND policyname = 'Allow all operations on analysis_results'
    ) THEN
        CREATE POLICY "Allow all operations on analysis_results" ON analysis_results FOR ALL USING (true);
    END IF;
END $$;

-- Insert some sample data if tables are empty (optional)
DO $$
BEGIN
    -- Check if files table is empty and insert sample data
    IF NOT EXISTS (SELECT 1 FROM files LIMIT 1) THEN
        INSERT INTO files (name, type, size, subject, status, progress, extracted_text, tags) VALUES
        (
            'Sample Calculus Document.pdf',
            'application/pdf',
            1024000,
            'Mathematics',
            'completed',
            100,
            'This is a sample calculus document covering integration techniques, derivatives, and applications of calculus in real-world scenarios.',
            ARRAY['calculus', 'mathematics', 'integration', 'derivatives']
        ),
        (
            'Physics Fundamentals.pdf',
            'application/pdf',
            2048000,
            'Physics',
            'completed',
            100,
            'Comprehensive physics document covering mechanics, thermodynamics, waves, and quantum physics principles.',
            ARRAY['physics', 'mechanics', 'thermodynamics', 'waves']
        );
    END IF;
END $$;

-- Verify the setup
SELECT 
    'Tables created successfully' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('files', 'document_chunks', 'analysis_results')) as table_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('files', 'document_chunks', 'analysis_results')) as policy_count;
