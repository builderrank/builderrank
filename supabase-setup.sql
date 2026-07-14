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

-- Connected dashboard beta tables.

create table if not exists public.br_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  site_id text unique,
  name text not null,
  website_url text not null,
  primary_trade text,
  phone text,
  market text,
  beta_status text not null default 'requested',
  tracking_status text not null default 'not_installed',
  beta_intake jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.br_businesses
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists site_id text unique,
  add column if not exists phone text,
  add column if not exists beta_status text not null default 'requested',
  add column if not exists tracking_status text not null default 'not_installed',
  add column if not exists beta_intake jsonb not null default '{}'::jsonb;

alter table public.reports
  add column if not exists business_id uuid references public.br_businesses(id) on delete set null;

create index if not exists reports_business_created_idx on public.reports (business_id, created_at desc);

create table if not exists public.br_job_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  label text not null,
  slug text not null,
  priority integer not null default 1,
  profit_weight numeric(5,2) not null default 1.00,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.br_job_types
  add column if not exists priority integer not null default 1,
  add column if not exists profit_weight numeric(5,2) not null default 1.00,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.br_competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  name text not null,
  website_url text,
  google_business_url text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.br_competitors
  add column if not exists website_url text,
  add column if not exists google_business_url text,
  add column if not exists notes text,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.br_prompts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  job_type_id uuid references public.br_job_types(id) on delete set null,
  prompt_text text not null,
  persona text,
  intent text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.br_prompts
  add column if not exists job_type_id uuid references public.br_job_types(id) on delete set null,
  add column if not exists persona text,
  add column if not exists intent text,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.br_prompt_runs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.br_prompts(id) on delete cascade,
  platform text not null,
  model text,
  run_status text not null default 'pending',
  raw_response jsonb,
  answer_text text,
  run_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.br_prompt_runs
  add column if not exists model text,
  add column if not exists run_status text not null default 'pending',
  add column if not exists raw_response jsonb,
  add column if not exists answer_text text,
  add column if not exists run_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

create table if not exists public.br_ai_mentions (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references public.br_prompt_runs(id) on delete cascade,
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  mentioned boolean not null default false,
  mention_text text,
  rank_position integer,
  sentiment text,
  confidence numeric(5,2),
  created_at timestamptz not null default now()
);

alter table public.br_ai_mentions
  add column if not exists mentioned boolean not null default false,
  add column if not exists mention_text text,
  add column if not exists rank_position integer,
  add column if not exists sentiment text,
  add column if not exists confidence numeric(5,2),
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.br_ai_sources (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references public.br_prompt_runs(id) on delete cascade,
  business_id uuid references public.br_businesses(id) on delete cascade,
  domain text not null,
  url text,
  source_type text,
  cited boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.br_ai_sources
  add column if not exists business_id uuid references public.br_businesses(id) on delete cascade,
  add column if not exists url text,
  add column if not exists source_type text,
  add column if not exists cited boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.br_website_events (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  business_id uuid references public.br_businesses(id) on delete set null,
  event text not null,
  page_url text,
  page_title text,
  referrer text,
  source_type text,
  source_name text,
  landing_path text,
  session_id text,
  utm jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  received_at timestamptz not null default now()
);

alter table public.br_website_events
  add column if not exists business_id uuid references public.br_businesses(id) on delete set null,
  add column if not exists page_url text,
  add column if not exists page_title text,
  add column if not exists referrer text,
  add column if not exists source_type text,
  add column if not exists source_name text,
  add column if not exists landing_path text,
  add column if not exists session_id text,
  add column if not exists utm jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists user_agent text,
  add column if not exists received_at timestamptz not null default now();

create table if not exists public.br_recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  job_type_id uuid references public.br_job_types(id) on delete set null,
  priority text not null,
  title text not null,
  body text not null,
  status text not null default 'open',
  source text not null default 'ai_dashboard',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.br_recommendations
  add column if not exists job_type_id uuid references public.br_job_types(id) on delete set null,
  add column if not exists priority text not null default 'medium',
  add column if not exists status text not null default 'open',
  add column if not exists source text not null default 'ai_dashboard',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

alter table public.br_businesses enable row level security;
alter table public.br_job_types enable row level security;
alter table public.br_competitors enable row level security;
alter table public.br_prompts enable row level security;
alter table public.br_prompt_runs enable row level security;
alter table public.br_ai_mentions enable row level security;
alter table public.br_ai_sources enable row level security;
alter table public.br_website_events enable row level security;
alter table public.br_recommendations enable row level security;

drop policy if exists "br_businesses_select_own" on public.br_businesses;
create policy "br_businesses_select_own"
on public.br_businesses for select to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "br_job_types_select_own" on public.br_job_types;
create policy "br_job_types_select_own"
on public.br_job_types for select to authenticated
using (exists (select 1 from public.br_businesses b where b.id = br_job_types.business_id and b.owner_user_id = auth.uid()));

drop policy if exists "br_competitors_select_own" on public.br_competitors;
create policy "br_competitors_select_own"
on public.br_competitors for select to authenticated
using (exists (select 1 from public.br_businesses b where b.id = br_competitors.business_id and b.owner_user_id = auth.uid()));

drop policy if exists "br_prompts_select_own" on public.br_prompts;
create policy "br_prompts_select_own"
on public.br_prompts for select to authenticated
using (exists (select 1 from public.br_businesses b where b.id = br_prompts.business_id and b.owner_user_id = auth.uid()));

drop policy if exists "br_recommendations_select_own" on public.br_recommendations;
create policy "br_recommendations_select_own"
on public.br_recommendations for select to authenticated
using (exists (select 1 from public.br_businesses b where b.id = br_recommendations.business_id and b.owner_user_id = auth.uid()));

drop policy if exists "br_website_events_no_client_write" on public.br_website_events;
create policy "br_website_events_no_client_write"
on public.br_website_events
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists br_businesses_owner_idx on public.br_businesses (owner_user_id);
create index if not exists br_businesses_site_id_idx on public.br_businesses (site_id);
create index if not exists br_job_types_business_idx on public.br_job_types (business_id);
create unique index if not exists br_job_types_business_slug_uidx on public.br_job_types (business_id, slug);
create index if not exists br_competitors_business_idx on public.br_competitors (business_id);
create unique index if not exists br_competitors_business_name_uidx on public.br_competitors (business_id, lower(name));
create unique index if not exists br_prompts_business_prompt_uidx on public.br_prompts (business_id, lower(prompt_text));
create index if not exists br_prompt_runs_prompt_run_at_idx on public.br_prompt_runs (prompt_id, run_at desc);
create unique index if not exists br_prompt_runs_prompt_platform_run_at_uidx on public.br_prompt_runs (prompt_id, platform, run_at);
create index if not exists br_ai_mentions_business_idx on public.br_ai_mentions (business_id, created_at desc);
create unique index if not exists br_ai_mentions_run_business_uidx on public.br_ai_mentions (prompt_run_id, business_id);
create index if not exists br_ai_sources_business_idx on public.br_ai_sources (business_id, created_at desc);
create unique index if not exists br_ai_sources_run_domain_url_uidx on public.br_ai_sources (prompt_run_id, domain, url);
create index if not exists br_website_events_site_received_idx on public.br_website_events (site_id, received_at desc);
create index if not exists br_website_events_session_idx on public.br_website_events (session_id);
create index if not exists br_website_events_site_event_received_idx on public.br_website_events (site_id, event, received_at desc);
create index if not exists br_website_events_site_source_received_idx on public.br_website_events (site_id, source_type, source_name, received_at desc);
create index if not exists br_recommendations_business_status_idx on public.br_recommendations (business_id, status, created_at desc);
create unique index if not exists br_recommendations_business_title_uidx on public.br_recommendations (business_id, lower(title));
