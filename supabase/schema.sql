-- TRACULATOR Supabase Database Schema & Row Level Security (RLS) Policies
-- Run this SQL in your Supabase Project SQL Editor

-- 1. Profiles Table (Customer Accounts & Admin Roles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  customer_id text unique not null,
  full_name text not null,
  mobile_number text,
  location text,
  default_rate numeric default 100,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index on customer_id for fast lookup
create index if not exists idx_profiles_customer_id on public.profiles(customer_id);

-- 2. Jobs Table (Completed Tractor Work History Records)
create table if not exists public.jobs (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  customer_name text not null,
  mobile_number text,
  address text,
  location text,
  work_description text,
  rate_per_minute numeric not null default 100,
  timer_mode text default 'stopwatch' check (timer_mode in ('stopwatch', 'countdown', 'manual')),
  duration_minutes_preset integer,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  duration_seconds integer not null default 0,
  work_amount numeric not null default 0,
  expenses jsonb default '{"diesel":0,"driver":0,"food":0,"other":0}'::jsonb not null,
  total_expenses numeric not null default 0,
  net_earnings numeric not null default 0,
  date text not null,
  status text default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_date on public.jobs(date);

-- 3. Customer Queue Table (Pending & In-Progress Customers)
create table if not exists public.customer_queue (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  customer_name text not null,
  mobile_number text,
  address text,
  location text,
  work_description text,
  rate_per_minute numeric not null default 100,
  timer_mode text default 'stopwatch' check (timer_mode in ('stopwatch', 'countdown', 'manual')),
  duration_minutes_preset integer,
  status text default 'pending' check (status in ('in_progress', 'pending', 'completed')),
  expenses jsonb default '{"diesel":0,"driver":0,"food":0,"other":0}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_queue_user_id on public.customer_queue(user_id);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.customer_queue enable row level security;

-- Helper function to check if current user is Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
create policy "Users can view own profile or admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile or admins update all"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- Jobs Policies (Strict Isolation: Customers only see their own jobs)
create policy "Users can select own jobs or admins view all"
  on public.jobs for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own jobs"
  on public.jobs for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own jobs"
  on public.jobs for delete
  using (auth.uid() = user_id or public.is_admin());

-- Customer Queue Policies
create policy "Users can select own queue or admins view all"
  on public.customer_queue for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own queue"
  on public.customer_queue for insert
  with check (auth.uid() = user_id);

create policy "Users can update own queue"
  on public.customer_queue for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own queue"
  on public.customer_queue for delete
  using (auth.uid() = user_id or public.is_admin());
