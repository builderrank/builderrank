create table if not exists public.br_ai_credit_accounts (
  business_id uuid primary key references public.br_businesses(id) on delete cascade,
  monthly_allowance integer not null default 120 check (monthly_allowance >= 0),
  purchased_credits integer not null default 0 check (purchased_credits >= 0),
  period_used integer not null default 0 check (period_used >= 0),
  period_start timestamptz not null default date_trunc('month', now()),
  period_end timestamptz not null default date_trunc('month', now()) + interval '1 month',
  daily_limit integer not null default 36 check (daily_limit > 0),
  per_batch_limit integer not null default 24 check (per_batch_limit > 0),
  cooldown_minutes integer not null default 30 check (cooldown_minutes >= 0),
  customer_rechecks_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.br_ai_recheck_batches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  user_id uuid,
  idempotency_key text not null,
  platforms text[] not null default '{}',
  target_term_ids uuid[] not null default '{}',
  estimated_credits integer not null,
  reserved_credits integer not null default 0,
  charged_credits integer not null default 0,
  status text not null default 'reserved' check (status in ('reserved','running','complete','partial','failed','blocked')),
  failure_detail text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (business_id, idempotency_key)
);

create table if not exists public.br_ai_recheck_runs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.br_ai_recheck_batches(id) on delete cascade,
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  prompt_id uuid references public.br_prompts(id) on delete set null,
  target_term_id uuid references public.br_target_terms(id) on delete set null,
  platform text not null,
  status text not null check (status in ('complete','failed')),
  credit_cost integer not null default 1,
  model text,
  error_detail text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.br_ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.br_businesses(id) on delete cascade,
  user_id uuid,
  batch_id uuid references public.br_ai_recheck_batches(id) on delete set null,
  entry_type text not null check (entry_type in ('reservation','refund','adjustment','purchase')),
  credit_delta integer not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.br_activity_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.br_businesses(id) on delete cascade,
  user_id uuid,
  event_type text not null,
  event_label text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists br_activity_events_dedupe_idx on public.br_activity_events(dedupe_key) where dedupe_key is not null;
create index if not exists br_ai_recheck_batches_business_created_idx on public.br_ai_recheck_batches(business_id, created_at desc);
create index if not exists br_ai_credit_ledger_business_created_idx on public.br_ai_credit_ledger(business_id, created_at desc);
create index if not exists br_activity_events_business_created_idx on public.br_activity_events(business_id, created_at desc);

alter table public.br_ai_credit_accounts enable row level security;
alter table public.br_ai_recheck_batches enable row level security;
alter table public.br_ai_recheck_runs enable row level security;
alter table public.br_ai_credit_ledger enable row level security;
alter table public.br_activity_events enable row level security;

create or replace function public.br_reserve_ai_recheck(
  p_business_id uuid, p_user_id uuid, p_idempotency_key text,
  p_platforms text[], p_target_term_ids uuid[], p_estimated_credits integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.br_ai_credit_accounts%rowtype; b public.br_ai_recheck_batches%rowtype;
  recent_used integer; remaining integer; last_run timestamptz;
begin
  if p_estimated_credits < 1 then raise exception 'At least one credit is required.'; end if;
  select * into b from public.br_ai_recheck_batches where business_id=p_business_id and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('batch_id',b.id,'duplicate',true,'status',b.status,'reserved',b.reserved_credits); end if;
  insert into public.br_ai_credit_accounts(business_id) values(p_business_id) on conflict do nothing;
  select * into a from public.br_ai_credit_accounts where business_id=p_business_id for update;
  if now() >= a.period_end then
    update public.br_ai_credit_accounts set period_used=0, period_start=date_trunc('month',now()), period_end=date_trunc('month',now())+interval '1 month', updated_at=now() where business_id=p_business_id returning * into a;
  end if;
  if not a.customer_rechecks_enabled then raise exception 'Customer AI rechecks are disabled for this workspace.'; end if;
  if p_estimated_credits > a.per_batch_limit then raise exception 'This recheck exceeds the % credit per-run limit.', a.per_batch_limit; end if;
  select coalesce(sum(case when status in ('reserved','running') then reserved_credits else charged_credits end),0) into recent_used from public.br_ai_recheck_batches where business_id=p_business_id and created_at >= now()-interval '24 hours' and status in ('reserved','running','complete','partial');
  if recent_used + p_estimated_credits > a.daily_limit then raise exception 'This recheck would exceed the % credit daily limit.', a.daily_limit; end if;
  select max(created_at) into last_run from public.br_ai_recheck_batches where business_id=p_business_id and status in ('reserved','running','complete','partial');
  if last_run is not null and last_run + make_interval(mins => a.cooldown_minutes) > now() then raise exception 'Please wait until % before another AI recheck.', to_char(last_run + make_interval(mins => a.cooldown_minutes),'HH12:MI AM'); end if;
  remaining := a.monthly_allowance + a.purchased_credits - a.period_used;
  if remaining < p_estimated_credits then raise exception 'Not enough AI monitoring credits. % remain and % are required.', remaining, p_estimated_credits; end if;
  update public.br_ai_credit_accounts set period_used=period_used+p_estimated_credits,updated_at=now() where business_id=p_business_id;
  insert into public.br_ai_recheck_batches(business_id,user_id,idempotency_key,platforms,target_term_ids,estimated_credits,reserved_credits)
    values(p_business_id,p_user_id,p_idempotency_key,p_platforms,p_target_term_ids,p_estimated_credits,p_estimated_credits) returning * into b;
  insert into public.br_ai_credit_ledger(business_id,user_id,batch_id,entry_type,credit_delta,note) values(p_business_id,p_user_id,b.id,'reservation',-p_estimated_credits,'AI platform prompt credits reserved');
  return jsonb_build_object('batch_id',b.id,'duplicate',false,'status',b.status,'reserved',p_estimated_credits,'remaining',remaining-p_estimated_credits);
end $$;

create or replace function public.br_finalize_ai_recheck(p_batch_id uuid, p_success_count integer, p_failure_count integer, p_failure_detail text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare b public.br_ai_recheck_batches%rowtype; refund integer; final_status text;
begin
  select * into b from public.br_ai_recheck_batches where id=p_batch_id for update;
  if not found then raise exception 'AI recheck batch not found.'; end if;
  if b.status in ('complete','partial','failed') then return jsonb_build_object('status',b.status,'charged',b.charged_credits); end if;
  refund := greatest(0,b.reserved_credits-greatest(0,p_success_count));
  final_status := case when p_success_count=0 then 'failed' when p_failure_count>0 then 'partial' else 'complete' end;
  update public.br_ai_recheck_batches set charged_credits=greatest(0,p_success_count),status=final_status,failure_detail=p_failure_detail,completed_at=now() where id=p_batch_id;
  if refund>0 then
    update public.br_ai_credit_accounts set period_used=greatest(0,period_used-refund),updated_at=now() where business_id=b.business_id;
    insert into public.br_ai_credit_ledger(business_id,user_id,batch_id,entry_type,credit_delta,note) values(b.business_id,b.user_id,b.id,'refund',refund,'Failed or unexecuted AI prompts automatically refunded');
  end if;
  return jsonb_build_object('status',final_status,'charged',greatest(0,p_success_count),'refunded',refund);
end $$;

revoke all on function public.br_reserve_ai_recheck(uuid,uuid,text,text[],uuid[],integer) from public, anon, authenticated;
revoke all on function public.br_finalize_ai_recheck(uuid,integer,integer,text) from public, anon, authenticated;
grant execute on function public.br_reserve_ai_recheck(uuid,uuid,text,text[],uuid[],integer) to service_role;
grant execute on function public.br_finalize_ai_recheck(uuid,integer,integer,text) to service_role;
