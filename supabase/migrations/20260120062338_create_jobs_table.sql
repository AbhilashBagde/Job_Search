BEGIN;

-- Create the jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    salary_range TEXT,
    location TEXT,
    job_link TEXT UNIQUE NOT NULL,
    sponsorship_proof TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    referral_status BOOLEAN DEFAULT FALSE,
    referrer_name TEXT,
    referrer_linkedin TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all users to read and write for now (since this is a personal agent)
-- In a production multi-tenant app, we would restrict this by user_id
CREATE POLICY "Allow public access to jobs" ON public.jobs
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMIT;