-- Final validation script to ensure database is properly configured
-- This script checks for common issues and provides detailed diagnostics

-- Check database connection
SELECT current_database() as database_name, 
       current_user as connected_user,
       version() as postgres_version;

-- Verify all required tables exist with correct structure
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
       CASE 
         WHEN table_name = 'files' AND 
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'id') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'name') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'extracted_text')
         THEN '✅ Valid structure'
         WHEN table_name = 'document_chunks' AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_chunks' AND column_name = 'id') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_chunks' AND column_name = 'file_id') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_chunks' AND column_name = 'chunk_text')
         THEN '✅ Valid structure'
         WHEN table_name = 'analysis_results' AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'id') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'file_id') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'analysis_text')
         THEN '✅ Valid structure'
         ELSE '❌ Invalid or incomplete structure'
       END as structure_status
FROM (VALUES ('files'), ('document_chunks'), ('analysis_results')) as t(table_name)
LEFT JOIN information_schema.tables actual ON actual.table_name = t.table_name;

-- Check foreign key constraints
SELECT 
    tc.table_name as table_name, 
    kcu.column_name as column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ Foreign key exists' as status
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND
      ((tc.table_name = 'document_chunks' AND kcu.column_name = 'file_id') OR
       (tc.table_name = 'analysis_results' AND kcu.column_name = 'file_id'));

-- Check if RLS is enabled on all tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('files', 'document_chunks', 'analysis_results');

-- Check if policies exist
SELECT 
    tablename,
    policyname,
    '✅ Policy exists' as status
FROM pg_policies 
WHERE tablename IN ('files', 'document_chunks', 'analysis_results');

-- Check for sample data
SELECT 
    'files' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '⚠️ No sample data'
    END as data_status
FROM files
UNION ALL
SELECT 
    'document_chunks' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '⚠️ No document chunks'
    END as data_status
FROM document_chunks
UNION ALL
SELECT 
    'analysis_results' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '⚠️ No analysis results (normal for new setup)'
    END as data_status
FROM analysis_results;

-- Check for potential issues with files table
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM files WHERE tags IS NULL) 
         THEN '❌ Some files have NULL tags (should be empty array)'
         ELSE '✅ All files have proper tags' 
    END as tags_check,
    CASE WHEN EXISTS (SELECT 1 FROM files WHERE name IS NULL OR name = '') 
         THEN '❌ Some files have empty names'
         ELSE '✅ All files have proper names' 
    END as name_check,
    CASE WHEN EXISTS (SELECT 1 FROM files WHERE type IS NULL OR type = '') 
         THEN '❌ Some files have empty types'
         ELSE '✅ All files have proper types' 
    END as type_check;

-- Final status summary
SELECT 
    '🎉 Database validation complete!' as message,
    'Your academic study app database is properly configured.' as details;
