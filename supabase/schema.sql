create extension if not exists pgcrypto;

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_slug text not null check (role_slug in ('prosights-cto', 'casa-founding-engineer', 'optery-senior-backend')),
  linkedin_url text,
  email text,
  location text,
  current_role text,
  current_company text,
  candidate_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.candidates(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  logistics jsonb not null default '{}'::jsonb,
  recruiter_notes text,
  technical_score numeric(3,2),
  operating_score numeric(3,2),
  overall_score numeric(3,2),
  decision text check (decision in ('Present', 'Hold', 'Reject')),
  decision_reasons jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assessments
  add column if not exists completed boolean not null default false;

create index if not exists assessments_updated_at_idx on public.assessments(updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists candidates_set_updated_at on public.candidates;
create trigger candidates_set_updated_at
before update on public.candidates
for each row execute function public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function public.set_updated_at();

-- Browser-direct access stays blocked. PurrfectHire uses the service role only
-- from Next.js server routes. Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
alter table public.candidates enable row level security;
alter table public.assessments enable row level security;
