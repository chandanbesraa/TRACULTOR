-- =========================================================
-- TRACULATOR Supabase Database Schema & Row Level Security (RLS)
-- =========================================================

-- 1. Profiles Table (Stores authenticated user profile info without username/handle)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies (Each authenticated user can only view and update their own profile)
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Automatic Profile Creation Trigger for every newly registered auth.users record
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, email, address, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'mobile_number', new.phone, ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'address', new.raw_user_meta_data->>'location', ''),
    now(),
    now()
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    phone = coalesce(excluded.phone, profiles.phone),
    email = coalesce(excluded.email, profiles.email),
    address = coalesce(excluded.address, profiles.address),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute automatically after registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 3. Jobs Table (Completed Work Records)
-- =========================================================
create table if not exists public.jobs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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

create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_date on public.jobs(date);

alter table public.jobs enable row level security;

create policy "Users can select own jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own jobs"
  on public.jobs for update
  using (auth.uid() = user_id);

create policy "Users can delete own jobs"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 4. Customer Queue Table (Pending & In-Progress Customers)
-- =========================================================
create table if not exists public.customer_queue (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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

alter table public.customer_queue enable row level security;

create policy "Users can select own queue"
  on public.customer_queue for select
  using (auth.uid() = user_id);

create policy "Users can insert own queue"
  on public.customer_queue for insert
  with check (auth.uid() = user_id);

create policy "Users can update own queue"
  on public.customer_queue for update
  using (auth.uid() = user_id);

create policy "Users can delete own queue"
  on public.customer_queue for delete
  using (auth.uid() = user_id);
