-- Builder Rank AI Visibility Dashboard schema draft
-- Designed for Supabase/Postgres. Review RLS policies before production use.

create table if not exists br_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  name text not null,
  website_url text not null,
  primary_trade text,
  phone text,
  market text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists br_job_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  label text not null,
  slug text not null,
  priority integer not null default 1,
  profit_weight numeric(5,2) not null default 1.00,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists br_service_areas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  market text not null,
  city text,
  state text,
  priority integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists br_competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  name text not null,
  website_url text,
  google_business_url text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists br_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  job_type_slug text not null,
  persona text not null default 'homeowner',
  intent text not null,
  template text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists br_prompts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  job_type_id uuid references br_job_types(id) on delete set null,
  service_area_id uuid references br_service_areas(id) on delete set null,
  prompt_text text not null,
  persona text,
  intent text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists br_target_terms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  job_type_id uuid references br_job_types(id) on delete set null,
  phrase text not null,
  target_market text,
  priority integer not null default 1,
  status text not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table br_prompts add column if not exists target_term_id uuid references br_target_terms(id) on delete set null;

create table if not exists br_prompt_runs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references br_prompts(id) on delete cascade,
  platform text not null,
  model text,
  run_status text not null default 'pending',
  raw_response jsonb,
  answer_text text,
  measurement_mode text not null default 'api_benchmark',
  consumer_surface text,
  verified_at timestamptz,
  verified_location text,
  verifier_context jsonb not null default '{}'::jsonb,
  run_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists br_ai_mentions (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references br_prompt_runs(id) on delete cascade,
  business_id uuid not null references br_businesses(id) on delete cascade,
  mentioned boolean not null default false,
  mention_text text,
  rank_position integer,
  sentiment text,
  confidence numeric(5,2),
  service_accuracy numeric(5,2),
  geo_accuracy numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists br_ai_competitor_mentions (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references br_prompt_runs(id) on delete cascade,
  competitor_id uuid references br_competitors(id) on delete set null,
  competitor_name text not null,
  rank_position integer,
  link_url text,
  source_domain text,
  created_at timestamptz not null default now()
);

create table if not exists br_ai_links (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references br_prompt_runs(id) on delete cascade,
  business_id uuid references br_businesses(id) on delete cascade,
  url text not null,
  domain text,
  link_type text not null, -- direct_site, google_business_profile, directory, review_site, social, competitor, no_link
  platform text,
  created_at timestamptz not null default now()
);

create table if not exists br_ai_sources (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references br_prompt_runs(id) on delete cascade,
  domain text not null,
  url text,
  source_type text, -- direct_site, directory, review_site, social, ugc, local_media, map, unknown
  cited boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists br_perception_scores (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  job_type_id uuid references br_job_types(id) on delete set null,
  service_area_id uuid references br_service_areas(id) on delete set null,
  platform text,
  attribute text not null,
  score numeric(5,2) not null,
  summary text,
  measured_at timestamptz not null default now()
);

create table if not exists br_website_events (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  business_id uuid references br_businesses(id) on delete set null,
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

create table if not exists br_recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references br_businesses(id) on delete cascade,
  job_type_id uuid references br_job_types(id) on delete set null,
  priority text not null,
  title text not null,
  body text not null,
  status text not null default 'open',
  source text not null default 'ai_dashboard',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table br_recommendations add column if not exists target_term_id uuid references br_target_terms(id) on delete set null;

create index if not exists br_prompt_runs_prompt_run_at_idx on br_prompt_runs(prompt_id, run_at desc);
create index if not exists br_prompt_runs_meta_mode_idx on br_prompt_runs(platform, measurement_mode, run_at desc);
create index if not exists br_ai_mentions_business_idx on br_ai_mentions(business_id, created_at desc);
create index if not exists br_website_events_site_received_idx on br_website_events(site_id, received_at desc);
create index if not exists br_website_events_session_idx on br_website_events(session_id);
create index if not exists br_website_events_site_event_received_idx on br_website_events(site_id, event, received_at desc);
create index if not exists br_website_events_site_source_received_idx on br_website_events(site_id, source_type, source_name, received_at desc);
create index if not exists br_perception_scores_business_idx on br_perception_scores(business_id, measured_at desc);
create index if not exists br_target_terms_business_status_idx on br_target_terms(business_id, status, priority);
