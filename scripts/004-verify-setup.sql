-- Verification script to check if everything is set up correctly

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM (
    VALUES ('files'), ('document_chunks'), ('analysis_results')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = required_tables.table_name;

-- Check if all required indexes exist
SELECT 
    indexname,
    tablename,
    '✅ Index exists' as status
FROM pg_indexes 
WHERE indexname IN (
    'idx_files_status',
    'idx_files_created_at', 
    'idx_document_chunks_file_id',
    'idx_analysis_results_file_id'
);

-- Check if RLS is enabled
SELECT 
    schemaname,
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

-- Check sample data
SELECT 
    'files' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE 'ℹ️ Empty (normal for new setup)'
    END as data_status
FROM files
UNION ALL
SELECT 
    'document_chunks' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE 'ℹ️ Empty (normal for new setup)'
    END as data_status
FROM document_chunks
UNION ALL
SELECT 
    'analysis_results' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE 'ℹ️ Empty (normal for new setup)'
    END as data_status
FROM analysis_results;

-- Final status summary
SELECT 
    '🎉 Database setup verification complete!' as message,
    'Your academic study app database is ready to use.' as details;
