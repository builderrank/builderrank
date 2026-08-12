create table if not exists public.br_target_terms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  job_type_id uuid references public.br_job_types(id) on delete set null,
  phrase text not null,
  target_market text,
  priority integer not null default 1,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.br_prompts add column if not exists target_term_id uuid references public.br_target_terms(id) on delete set null;
alter table public.br_recommendations add column if not exists target_term_id uuid references public.br_target_terms(id) on delete set null;
alter table public.br_target_terms enable row level security;

drop policy if exists "br_target_terms_select_own" on public.br_target_terms;
create policy "br_target_terms_select_own" on public.br_target_terms for select to authenticated
using (exists (select 1 from public.br_businesses b where b.id = br_target_terms.business_id and b.owner_user_id = auth.uid()));

create unique index if not exists br_target_terms_business_phrase_uidx on public.br_target_terms (business_id, lower(phrase)) where status <> 'archived';
create index if not exists br_target_terms_business_status_idx on public.br_target_terms (business_id, status, priority);
create index if not exists br_prompts_target_term_idx on public.br_prompts (target_term_id);
create index if not exists br_recommendations_target_term_idx on public.br_recommendations (target_term_id);
