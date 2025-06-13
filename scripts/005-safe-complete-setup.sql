-- Complete safe setup script that handles all existing objects
-- This script can be run multiple times safely

-- Drop existing policies if they exist (to recreate them cleanly)
DO $$
BEGIN
    -- Drop policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Allow all operations on files') THEN
        DROP POLICY "Allow all operations on files" ON files;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_chunks' AND policyname = 'Allow all operations on document_chunks') THEN
        DROP POLICY "Allow all operations on document_chunks" ON document_chunks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analysis_results' AND policyname = 'Allow all operations on analysis_results') THEN
        DROP POLICY "Allow all operations on analysis_results" ON analysis_results;
    END IF;
END $$;

-- Create tables if they don't exist
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

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies (now that we've dropped any existing ones)
CREATE POLICY "Allow all operations on files" ON files FOR ALL USING (true);
CREATE POLICY "Allow all operations on document_chunks" ON document_chunks FOR ALL USING (true);
CREATE POLICY "Allow all operations on analysis_results" ON analysis_results FOR ALL USING (true);

-- Insert sample data if tables are empty (optional)
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
        );
    END IF;
END $$;

-- Success message
SELECT 
    '✅ Database setup completed successfully!' as status,
    'All tables, indexes, and policies are now properly configured.' as message,
    'You can now upload documents and generate quizzes.' as next_steps;
