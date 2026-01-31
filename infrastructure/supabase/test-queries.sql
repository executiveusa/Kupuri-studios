-- Kupuri Media - Supabase Test Queries
-- Use these to verify schema deployment and test functionality

-- ============================================
-- 1. VERIFY SCHEMA DEPLOYMENT
-- ============================================

-- Check all tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected output: 8 tables
-- agent_logs, media_assets, posts, projects, social_accounts, system_config, users, workflow_executions

-- Check all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check all triggers
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 2. TEST DATA INSERTION
-- ============================================

-- Insert test user
INSERT INTO users (email, name, metadata)
VALUES ('test@kupurimedia.com', 'Test User', '{"role": "admin", "language": "es"}'::JSONB)
RETURNING *;

-- Insert test project
INSERT INTO projects (user_id, name, description, tags)
VALUES (
    (SELECT id FROM users WHERE email = 'test@kupurimedia.com'),
    'Test Project - Real Estate Campaign',
    'Sample real estate marketing campaign for testing',
    ARRAY['real-estate', 'video', 'social-media']
)
RETURNING *;

-- Insert test media asset
INSERT INTO media_assets (project_id, type, url, filename, mime_type, metadata)
VALUES (
    (SELECT id FROM projects WHERE name LIKE 'Test Project%' LIMIT 1),
    'image',
    'https://example.com/sample-property.jpg',
    'sample-property.jpg',
    'image/jpeg',
    '{"width": 1920, "height": 1080, "ai_generated": true}'::JSONB
)
RETURNING *;

-- Insert test social account
INSERT INTO social_accounts (user_id, platform, account_id, account_name, credentials)
VALUES (
    (SELECT id FROM users WHERE email = 'test@kupurimedia.com'),
    'instagram',
    'kupuri_test_account',
    'Kupuri Test Account',
    '{"access_token": "test_token_encrypted", "expires_at": "2026-12-31"}'::JSONB
)
RETURNING *;

-- Insert test post
INSERT INTO posts (project_id, user_id, content, status, platforms, scheduled_at)
VALUES (
    (SELECT id FROM projects WHERE name LIKE 'Test Project%' LIMIT 1),
    (SELECT id FROM users WHERE email = 'test@kupurimedia.com'),
    'Check out this amazing property! #RealEstate #CDMX',
    'scheduled',
    ARRAY['instagram', 'facebook'],
    NOW() + INTERVAL '1 day'
)
RETURNING *;

-- Insert test agent log
INSERT INTO agent_logs (agent_name, action, result, status, execution_time_ms, metadata)
VALUES (
    'WhisperSTT',
    'transcribe_audio',
    'Successfully transcribed 30-second Spanish audio file',
    'success',
    1250,
    '{"audio_duration": 30, "language": "es", "confidence": 0.95}'::JSONB
)
RETURNING *;

-- Insert test workflow execution
INSERT INTO workflow_executions (workflow_id, workflow_name, status, result, execution_time_ms)
VALUES (
    'create_real_estate_video',
    'Create Real Estate Video',
    'completed',
    '{"video_url": "https://example.com/video.mp4", "platforms_posted": ["instagram", "facebook"]}'::JSONB,
    45000
)
RETURNING *;

-- ============================================
-- 3. TEST QUERIES
-- ============================================

-- Get all users with their project counts
SELECT
    u.id,
    u.email,
    u.name,
    COUNT(p.id) as project_count,
    u.created_at
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
GROUP BY u.id, u.email, u.name, u.created_at
ORDER BY u.created_at DESC;

-- Get projects with media asset counts
SELECT
    p.id,
    p.name,
    p.status,
    COUNT(ma.id) as media_count,
    p.created_at
FROM projects p
LEFT JOIN media_assets ma ON p.id = ma.project_id
GROUP BY p.id, p.name, p.status, p.created_at
ORDER BY p.created_at DESC;

-- Get scheduled posts with project and user info
SELECT
    po.id,
    po.content,
    po.status,
    po.scheduled_at,
    po.platforms,
    pr.name as project_name,
    u.name as user_name
FROM posts po
JOIN projects pr ON po.project_id = pr.id
JOIN users u ON po.user_id = u.id
WHERE po.status = 'scheduled'
ORDER BY po.scheduled_at ASC;

-- Get recent agent logs with status breakdown
SELECT
    agent_name,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'success') as successful,
    COUNT(*) FILTER (WHERE status = 'failure') as failed,
    AVG(execution_time_ms) as avg_execution_time_ms
FROM agent_logs
GROUP BY agent_name
ORDER BY total_executions DESC;

-- Get workflow execution statistics
SELECT
    workflow_name,
    status,
    COUNT(*) as execution_count,
    AVG(execution_time_ms) as avg_duration_ms,
    MIN(started_at) as first_run,
    MAX(started_at) as last_run
FROM workflow_executions
GROUP BY workflow_name, status
ORDER BY workflow_name, status;

-- Get user social media accounts
SELECT
    u.name as user_name,
    sa.platform,
    sa.account_name,
    sa.is_active,
    sa.last_sync_at
FROM social_accounts sa
JOIN users u ON sa.user_id = u.id
ORDER BY u.name, sa.platform;

-- ============================================
-- 4. VERIFY RLS POLICIES
-- ============================================

-- Check RLS is enabled on all tables
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'projects', 'media_assets', 'agent_logs', 'workflow_executions', 'social_accounts', 'posts')
ORDER BY tablename;

-- List all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 5. SYSTEM HEALTH CHECKS
-- ============================================

-- Check system configuration
SELECT * FROM system_config ORDER BY key;

-- Get database size
SELECT
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Get table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Check for missing indexes (tables with no indexes)
SELECT
    t.tablename
FROM pg_tables t
LEFT JOIN pg_indexes i ON t.tablename = i.tablename AND t.schemaname = i.schemaname
WHERE t.schemaname = 'public'
AND i.indexname IS NULL
GROUP BY t.tablename;

-- ============================================
-- 6. PERFORMANCE QUERIES
-- ============================================

-- Get slow query candidates (tables with many rows but no indexes on common columns)
SELECT
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY tablename, n_distinct DESC;

-- Check for unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY tablename, indexname;

-- ============================================
-- 7. CLEANUP (USE WITH CAUTION)
-- ============================================

-- Delete test data (uncomment to use)
-- DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE email = 'test@kupurimedia.com');
-- DELETE FROM media_assets WHERE project_id IN (SELECT id FROM projects WHERE user_id IN (SELECT id FROM users WHERE email = 'test@kupurimedia.com'));
-- DELETE FROM social_accounts WHERE user_id IN (SELECT id FROM users WHERE email = 'test@kupurimedia.com');
-- DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE email = 'test@kupurimedia.com');
-- DELETE FROM users WHERE email = 'test@kupurimedia.com';
-- DELETE FROM agent_logs WHERE metadata->>'test' = 'true';
-- DELETE FROM workflow_executions WHERE workflow_id = 'test_workflow';

-- ============================================
-- 8. MIGRATION VERIFICATION CHECKLIST
-- ============================================

-- Run this to get a summary of the schema status
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    SELECT COUNT(*) INTO index_count FROM pg_indexes
    WHERE schemaname = 'public';

    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers
    WHERE trigger_schema = 'public';

    SELECT COUNT(*) INTO policy_count FROM pg_policies
    WHERE schemaname = 'public';

    SELECT COUNT(*) INTO config_count FROM system_config;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'KUPURI MEDIA - SCHEMA VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: % (expected: 8)', table_count;
    RAISE NOTICE 'Indexes created: % (expected: 20+)', index_count;
    RAISE NOTICE 'Triggers created: % (expected: 6+)', trigger_count;
    RAISE NOTICE 'RLS Policies created: % (expected: 7+)', policy_count;
    RAISE NOTICE 'System config entries: % (expected: 6)', config_count;
    RAISE NOTICE '========================================';

    IF table_count >= 8 AND index_count >= 20 AND trigger_count >= 6 THEN
        RAISE NOTICE '✅ Schema deployment SUCCESSFUL';
    ELSE
        RAISE NOTICE '⚠️  Schema deployment INCOMPLETE - check missing components';
    END IF;
END $$;
