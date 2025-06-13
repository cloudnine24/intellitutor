-- Complete safe setup script with additional error handling and validation
-- This script can be run multiple times safely and will handle all edge cases

-- Function to log messages
CREATE OR REPLACE FUNCTION log_message(message TEXT) RETURNS VOID AS $$
BEGIN
    RAISE NOTICE '%', message;
END;
$$ LANGUAGE plpgsql;

-- Begin setup with logging
SELECT log_message('Starting database setup...');

-- Disable RLS temporarily to avoid policy conflicts
DO $$ 
BEGIN
    SELECT log_message('Disabling RLS temporarily...');
    
    -- Safely disable RLS on tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'files') THEN
        ALTER TABLE files DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_chunks') THEN
        ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analysis_results') THEN
        ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop policies if they exist
DO $$ 
BEGIN
    SELECT log_message('Removing existing policies...');
    
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Allow all operations on files" ON files;
    DROP POLICY IF EXISTS "Allow all operations on document_chunks" ON document_chunks;
    DROP POLICY IF EXISTS "Allow all operations on analysis_results" ON analysis_results;
END $$;

-- Create vector extension if it doesn't exist (for future use)
DO
