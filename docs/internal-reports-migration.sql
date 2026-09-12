-- Private full-fidelity report archive for Builder Rank demo calls.
-- Run once in the Supabase SQL Editor before deploying the matching application code.

create table if not exists public.br_internal_reports (
  id uuid primary key default gen_random_uuid(),
  report_run_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  company text,
  website text not null,
  market text,
  score integer,
  report jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.br_internal_reports enable row level security;

drop policy if exists "internal_reports_no_client_access" on public.br_internal_reports;
create policy "internal_reports_no_client_access"
on public.br_internal_reports
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists br_internal_reports_created_idx on public.br_internal_reports (created_at desc);
create index if not exists br_internal_reports_user_idx on public.br_internal_reports (user_id, created_at desc);
