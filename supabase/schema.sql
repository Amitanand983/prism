create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_otps_email_created_idx
  on public.email_otps (email, created_at desc);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_hash_idx
  on public.user_sessions (session_hash);

create table if not exists public.pr_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  pr_url text not null,
  pr_title text not null,
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_score integer not null check (risk_score between 0 and 10),
  report jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pr_analyses
  drop constraint if exists pr_analyses_user_id_fkey;

alter table public.pr_analyses
  add constraint pr_analyses_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

create index if not exists pr_analyses_user_created_idx
  on public.pr_analyses (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.email_otps enable row level security;
alter table public.user_sessions enable row level security;
alter table public.pr_analyses enable row level security;

drop policy if exists "Users can read their own PR analyses" on public.pr_analyses;
drop policy if exists "Users can create their own PR analyses" on public.pr_analyses;
