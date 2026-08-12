-- Meta AI Visibility provenance and accuracy fields.
-- Apply in Supabase before deploying the application code that reads these fields.

alter table public.br_prompt_runs
  add column if not exists measurement_mode text not null default 'api_benchmark',
  add column if not exists consumer_surface text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_location text,
  add column if not exists verifier_context jsonb not null default '{}'::jsonb;

alter table public.br_ai_mentions
  add column if not exists service_accuracy numeric(5,2),
  add column if not exists geo_accuracy numeric(5,2);

create index if not exists br_prompt_runs_meta_mode_idx
  on public.br_prompt_runs(platform, measurement_mode, run_at desc);

alter table public.br_prompt_runs
  drop constraint if exists br_prompt_runs_measurement_mode_check;
alter table public.br_prompt_runs
  add constraint br_prompt_runs_measurement_mode_check
  check (measurement_mode in ('api_benchmark', 'consumer_verified'));

alter table public.br_ai_mentions
  drop constraint if exists br_ai_mentions_service_accuracy_check;
alter table public.br_ai_mentions
  add constraint br_ai_mentions_service_accuracy_check
  check (service_accuracy is null or service_accuracy between 0 and 100);

alter table public.br_ai_mentions
  drop constraint if exists br_ai_mentions_geo_accuracy_check;
alter table public.br_ai_mentions
  add constraint br_ai_mentions_geo_accuracy_check
  check (geo_accuracy is null or geo_accuracy between 0 and 100);
