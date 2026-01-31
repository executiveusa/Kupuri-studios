/**
 * Supabase Migration Deployment Script
 * Deploys schema to kbphngxqozmpfrbdzgca project
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://kbphngxqozmpfrbdzgca.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_c2b4eb447e91484cb25989f08532a534d0267355';

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployMigrations() {
  console.log('🚀 Starting Supabase migration deployment...\n');
  console.log(`📍 Project: kbphngxqozmpfrbdzgca`);
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    console.log(`📄 Reading migration: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Execute migration using raw SQL
    // Note: Supabase JS client doesn't directly support raw SQL execution
    // We'll need to use the REST API or PostgreSQL client
    console.log('⚠️  Manual deployment required:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/kbphngxqozmpfrbdzgca/editor');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the SQL from: infrastructure/supabase/migrations/001_initial_schema.sql');
    console.log('4. Paste and execute in the SQL Editor\n');

    // Alternative: Save instructions to a file
    const instructionsPath = path.join(__dirname, 'DEPLOYMENT_INSTRUCTIONS.md');
    const instructions = `# Supabase Migration Deployment Instructions

## Project Details
- **Project ID**: kbphngxqozmpfrbdzgca
- **URL**: https://kbphngxqozmpfrbdzgca.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/kbphngxqozmpfrbdzgca

## Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended)
1. Open: https://supabase.com/dashboard/project/kbphngxqozmpfrbdzgca/editor
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of \`migrations/001_initial_schema.sql\`
5. Paste into the SQL Editor
6. Click "Run" to execute

### Option 2: Via Supabase CLI
\`\`\`bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref kbphngxqozmpfrbdzgca

# Run migration
supabase db push

# Or apply specific migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.kbphngxqozmpfrbdzgca.supabase.co:5432/postgres" < migrations/001_initial_schema.sql
\`\`\`

### Option 3: Via PostgreSQL Client
\`\`\`bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.kbphngxqozmpfrbdzgca.supabase.co:5432/postgres" -f migrations/001_initial_schema.sql

# Using pgAdmin or DBeaver
# Connection string: postgresql://postgres:[YOUR-PASSWORD]@db.kbphngxqozmpfrbdzgca.supabase.co:5432/postgres
\`\`\`

## Verification Queries

After deployment, run these queries to verify:

\`\`\`sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should return:
-- agent_logs
-- media_assets
-- posts
-- projects
-- social_accounts
-- system_config
-- users
-- workflow_executions

-- Check row counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'media_assets', COUNT(*) FROM media_assets
UNION ALL
SELECT 'agent_logs', COUNT(*) FROM agent_logs
UNION ALL
SELECT 'workflow_executions', COUNT(*) FROM workflow_executions
UNION ALL
SELECT 'social_accounts', COUNT(*) FROM social_accounts
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'system_config', COUNT(*) FROM system_config;

-- Check system config initialization
SELECT * FROM system_config ORDER BY key;
\`\`\`

## Expected Results
- 8 tables created: users, projects, media_assets, agent_logs, workflow_executions, social_accounts, posts, system_config
- All indexes created successfully
- RLS policies applied
- Triggers for auto-updating timestamps active
- 6 system config entries initialized

## Troubleshooting

### Error: "relation already exists"
This means tables are already created. You can either:
1. Drop existing tables: \`DROP TABLE IF EXISTS table_name CASCADE;\`
2. Skip the migration if schema is already correct

### Error: "permission denied"
Make sure you're using the service role key, not the anon key.

### Error: "syntax error"
Check that you're using PostgreSQL-compatible SQL editor (not MySQL or other).

## Next Steps
After successful deployment:
1. Test database connection from application
2. Create test users and projects
3. Verify RLS policies are working
4. Run integration tests
`;

    fs.writeFileSync(instructionsPath, instructions);
    console.log(`✅ Deployment instructions saved to: ${instructionsPath}\n`);

    // Test connection to Supabase
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('system_config').select('*').limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️  Tables not yet created. Please follow deployment instructions above.\n');
      } else {
        console.error('❌ Connection error:', error.message);
      }
    } else {
      console.log('✅ Supabase connection successful!');
      if (data && data.length > 0) {
        console.log('✅ Migration appears to be deployed (system_config table accessible)');
        console.log(`📊 Found ${data.length} config entries\n`);
      }
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployMigrations();
