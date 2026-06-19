-- Builder Rank production tables and RLS policies.
-- Run this in Supabase SQL Editor after reviewing existing table definitions.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email text,
  phone text,
  company text,
  website text not null,
  market text,
  score integer,
  grade text,
  checkout_reference text,
  report jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.reports
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  add column if not exists phone text,
  add column if not exists checkout_reference text;

-- Existing report rows without user_id need a manual one-time backfill if they should remain visible.

alter table public.reports enable row level security;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own"
on public.reports
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);
create index if not exists reports_checkout_reference_idx on public.reports (checkout_reference);
create unique index if not exists reports_user_checkout_reference_uidx
  on public.reports (user_id, checkout_reference)
  where checkout_reference is not null and checkout_reference <> '';

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique,
  stripe_session_id text unique,
  checkout_reference text,
  customer_email text,
  customer_phone text,
  amount_total integer,
  currency text,
  payment_status text,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

drop policy if exists "purchases_no_client_access" on public.purchases;
create policy "purchases_no_client_access"
on public.purchases
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists purchases_checkout_reference_idx on public.purchases (checkout_reference);
create unique index if not exists purchases_checkout_reference_uidx
  on public.purchases (checkout_reference)
  where checkout_reference is not null and checkout_reference <> '';
create index if not exists purchases_customer_email_idx on public.purchases (customer_email);
