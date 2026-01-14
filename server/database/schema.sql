-- Kupuri Studios AI OS - Supabase Database Schema
-- ================================================
-- PostgreSQL schema for the autonomous AI agency platform
-- Supports: Users, Subscriptions, Videos, Agents, Relay Races

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- USERS & AUTHENTICATION
-- ===========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    phone TEXT,
    locale TEXT DEFAULT 'es-MX',
    timezone TEXT DEFAULT 'America/Mexico_City',
    
    -- Subscription info
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    
    -- Usage limits
    monthly_video_credits INTEGER DEFAULT 0,
    monthly_video_used INTEGER DEFAULT 0,
    monthly_api_calls INTEGER DEFAULT 0,
    monthly_api_used INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON public.profiles(stripe_customer_id);

-- ===========================================
-- SUBSCRIPTIONS & PAYMENTS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    
    -- Plan details
    plan_name TEXT NOT NULL,
    plan_tier TEXT NOT NULL CHECK (plan_tier IN ('professional', 'enterprise')),
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    billing_interval TEXT DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
    
    -- Dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- Payment history
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    
    -- Stripe data
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    
    -- Payment details
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    
    -- Metadata
    description TEXT,
    receipt_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

-- ===========================================
-- VIDEO GENERATION
-- ===========================================

CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Video metadata
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Source content
    original_audio_url TEXT,
    transcription TEXT,
    generated_script TEXT,
    
    -- Output
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    
    -- HeyGen data
    heygen_video_id TEXT,
    heygen_status TEXT,
    
    -- Avatar settings
    avatar_id TEXT DEFAULT 'Kristin_public_2_20240108',
    avatar_name TEXT DEFAULT 'Kristin',
    voice_id TEXT,
    language TEXT DEFAULT 'es',
    
    -- Quality settings
    video_quality TEXT DEFAULT '1080p' CHECK (video_quality IN ('720p', '1080p', '4k')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_videos_user ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);

-- ===========================================
-- AGENT SYSTEM
-- ===========================================

-- Agent definitions
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Agent info
    name TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('scope_executor', 'documentation', 'infrastructure', 'validation', 'custom')),
    
    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,
    capabilities TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default agents
INSERT INTO public.agents (name, role, agent_type, description, capabilities) VALUES
    ('ScopeExecutor', 'Execute tasks within authorized scope', 'scope_executor', 'Agent A - Executes only authorized tasks in documented order', ARRAY['task_execution', 'scope_validation']),
    ('DocumentationAgent', 'Update documentation and create audit trail', 'documentation', 'Agent B - Updates docs, verifies alignment, creates audit notes', ARRAY['doc_update', 'audit_trail']),
    ('InfrastructureAgent', 'Verify infrastructure readiness', 'infrastructure', 'Agent C - Checks dependencies, external systems, readiness checklist', ARRAY['infra_check', 'dependency_verification']),
    ('ValidationAgent', 'Execute validation gates', 'validation', 'Runs between agent handoffs to ensure quality', ARRAY['gate_validation', 'veto_power'])
ON CONFLICT (name) DO NOTHING;

-- Relay races (workflow executions)
CREATE TABLE IF NOT EXISTS public.relay_races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Race info
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized', 'running', 'completed', 'failed', 'blocked', 'vetoed')),
    
    -- Progress
    current_leg INTEGER DEFAULT 0,
    gates_passed INTEGER DEFAULT 0,
    total_gates INTEGER DEFAULT 5,
    
    -- Authorization
    authorization JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Results
    tasks JSONB DEFAULT '[]'::jsonb,
    gate_results JSONB DEFAULT '[]'::jsonb,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error handling
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_relay_races_user ON public.relay_races(user_id);
CREATE INDEX IF NOT EXISTS idx_relay_races_status ON public.relay_races(status);

-- Agent tasks
CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES public.relay_races(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Task info
    task_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'blocked')),
    
    -- Data
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_race ON public.agent_tasks(race_id);

-- ===========================================
-- CHAT & CONVERSATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Conversation info
    title TEXT,
    model TEXT DEFAULT 'glm-4.7',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
    content TEXT NOT NULL,
    
    -- Model info
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- ===========================================
-- USAGE & ANALYTICS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Usage info
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    
    -- Request/Response
    request_body JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    
    -- Model usage
    model TEXT,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON public.usage_logs(created_at DESC);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

-- Videos policies
CREATE POLICY "Users can view their own videos" ON public.videos
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own videos" ON public.videos
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own videos" ON public.videos
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own videos" ON public.videos
    FOR DELETE USING (user_id = auth.uid());

-- Relay races policies
CREATE POLICY "Users can view their own relay races" ON public.relay_races
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert relay races" ON public.relay_races
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations" ON public.conversations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON public.conversations
    FOR DELETE USING (user_id = auth.uid());

-- Messages policies (via conversation ownership)
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment video usage
CREATE OR REPLACE FUNCTION increment_video_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET monthly_video_used = monthly_video_used + 1
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check video credits
CREATE OR REPLACE FUNCTION check_video_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_credits INTEGER;
    v_used INTEGER;
BEGIN
    SELECT monthly_video_credits, monthly_video_used
    INTO v_credits, v_used
    FROM public.profiles
    WHERE id = p_user_id;
    
    RETURN v_used < v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Note: Run this after tables are created
-- Insert default subscription tiers (for reference)
-- Professional: $99/month, 50 videos
-- Enterprise: $299/month, 200 videos + priority support

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.subscriptions IS 'Stripe subscription management';
COMMENT ON TABLE public.videos IS 'Generated video content';
COMMENT ON TABLE public.agents IS 'AI agent definitions for Lightning Orchestrator';
COMMENT ON TABLE public.relay_races IS 'Workflow executions following Relay Framework';
COMMENT ON TABLE public.agent_tasks IS 'Individual agent task executions';
