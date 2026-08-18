-- Atomic report entitlements and abuse controls.
-- Apply before deploying code that calls br_reserve_report_run/br_finalize_report_run.

alter table public.purchases
  add column if not exists consumed_by_report_run_id uuid,
  add column if not exists consumed_at timestamptz;

create table if not exists public.br_report_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  checkout_reference text not null,
  request_fingerprint text not null,
  mode text not null check (mode in ('free','paid')),
  status text not null default 'reserved' check (status in ('reserved','running','complete','failed')),
  attempt_count integer not null default 1 check (attempt_count between 1 and 6),
  website text not null,
  market text,
  failure_code text,
  email_status text not null default 'pending' check (email_status in ('pending','sending','sent','failed')),
  email_attempts integer not null default 0 check (email_attempts between 0 and 3),
  email_claimed_at timestamptz,
  email_provider_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (user_id, checkout_reference)
);

alter table public.br_report_runs
  add column if not exists email_status text not null default 'pending',
  add column if not exists email_attempts integer not null default 0,
  add column if not exists email_claimed_at timestamptz,
  add column if not exists email_provider_id text;

alter table public.purchases drop constraint if exists purchases_consumed_by_report_run_id_fkey;
alter table public.purchases
  add constraint purchases_consumed_by_report_run_id_fkey
  foreign key (consumed_by_report_run_id) references public.br_report_runs(id) on delete set null;

create index if not exists br_report_runs_user_created_idx on public.br_report_runs(user_id, created_at desc);
create index if not exists br_report_runs_fingerprint_created_idx on public.br_report_runs(request_fingerprint, created_at desc);
create unique index if not exists purchases_one_report_run_uidx
  on public.purchases(consumed_by_report_run_id) where consumed_by_report_run_id is not null;

alter table public.br_report_runs enable row level security;
drop policy if exists "br_report_runs_no_client_access" on public.br_report_runs;
create policy "br_report_runs_no_client_access" on public.br_report_runs as restrictive
  for all to anon, authenticated using (false) with check (false);

create or replace function public.br_reserve_report_run(
  p_user_id uuid,
  p_email text,
  p_checkout_reference text,
  p_request_fingerprint text,
  p_website text,
  p_market text default ''
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  r public.br_report_runs%rowtype;
  purchase public.purchases%rowtype;
  report_count integer;
  daily_user_attempts integer;
  daily_fingerprint_attempts integer;
  selected_mode text;
begin
  if p_user_id is null or length(trim(p_email)) < 3 then raise exception 'Authenticated account is required.'; end if;
  if p_checkout_reference !~ '^[A-Za-z0-9_-]{16,120}$' then raise exception 'Invalid report request reference.'; end if;
  if length(p_request_fingerprint) < 32 then raise exception 'Invalid request fingerprint.'; end if;
  if length(p_website) > 2048 or length(coalesce(p_market,'')) > 160 then raise exception 'Report input is too long.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Recover abandoned reservations without leaving a paid credit locked forever.
  update public.purchases p set consumed_by_report_run_id=null, consumed_at=null
    from public.br_report_runs stale
    where p.consumed_by_report_run_id=stale.id
      and stale.user_id=p_user_id and stale.status in ('reserved','running')
      and stale.created_at < now()-interval '10 minutes';
  update public.br_report_runs set status='failed', failure_code='stale_reservation', completed_at=now()
    where user_id=p_user_id and status in ('reserved','running') and created_at < now()-interval '10 minutes';

  select * into r from public.br_report_runs
    where user_id=p_user_id and checkout_reference=p_checkout_reference for update;
  if found and r.status='complete' then
    return jsonb_build_object('run_id',r.id,'duplicate',true,'status',r.status,'mode',r.mode);
  elsif found and r.status in ('reserved','running') then
    return jsonb_build_object('run_id',r.id,'duplicate',true,'status',r.status,'mode',r.mode);
  elsif found and r.attempt_count >= 3 then
    raise exception 'This report reached its automatic retry limit. Contact Builder Rank support.';
  end if;

  select count(*) into daily_user_attempts from public.br_report_runs
    where user_id=p_user_id and created_at >= now()-interval '24 hours';
  select count(*) into daily_fingerprint_attempts from public.br_report_runs
    where request_fingerprint=p_request_fingerprint and created_at >= now()-interval '24 hours';
  if daily_user_attempts >= 4 then raise exception 'Daily report attempt limit reached for this account.'; end if;
  if daily_fingerprint_attempts >= 8 then raise exception 'Daily report attempt limit reached for this connection.'; end if;

  select count(*) into report_count from public.reports
    where user_id=p_user_id or lower(coalesce(email,''))=lower(trim(p_email));
  if report_count=0 and not exists(
    select 1 from public.br_report_runs where user_id=p_user_id and mode='free' and status='complete'
  ) then
    selected_mode := 'free';
  else
    select * into purchase from public.purchases
      where checkout_reference=p_checkout_reference for update;
    if not found then raise exception 'A paid report credit is required.'; end if;
    if lower(coalesce(purchase.customer_email,'')) <> '' and lower(purchase.customer_email) <> lower(trim(p_email)) then
      raise exception 'This report credit belongs to a different account.';
    end if;
    if lower(coalesce(purchase.payment_status,'')) <> 'paid' or coalesce(purchase.amount_total,0) < 1000 then
      raise exception 'Stripe has not confirmed a valid paid report credit.';
    end if;
    if purchase.consumed_by_report_run_id is not null and (r.id is null or purchase.consumed_by_report_run_id <> r.id) then
      raise exception 'This paid report credit has already been used.';
    end if;
    selected_mode := 'paid';
  end if;

  if r.id is null then
    insert into public.br_report_runs(user_id,email,checkout_reference,request_fingerprint,mode,status,website,market,started_at)
      values(p_user_id,lower(trim(p_email)),p_checkout_reference,p_request_fingerprint,selected_mode,'running',p_website,p_market,now())
      returning * into r;
  else
    update public.br_report_runs set status='running',attempt_count=attempt_count+1,failure_code=null,
      request_fingerprint=p_request_fingerprint,website=p_website,market=p_market,started_at=now(),completed_at=null
      where id=r.id returning * into r;
  end if;

  if selected_mode='paid' then
    update public.purchases set consumed_by_report_run_id=r.id, consumed_at=now() where id=purchase.id;
  end if;
  return jsonb_build_object('run_id',r.id,'duplicate',false,'status',r.status,'mode',selected_mode);
end $$;

create or replace function public.br_finalize_report_run(
  p_run_id uuid, p_success boolean, p_failure_code text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.br_report_runs%rowtype;
begin
  select * into r from public.br_report_runs where id=p_run_id for update;
  if not found then raise exception 'Report run not found.'; end if;
  if r.status='complete' then return jsonb_build_object('status','complete','mode',r.mode); end if;
  if p_success then
    update public.br_report_runs set status='complete',failure_code=null,completed_at=now() where id=r.id;
  else
    update public.br_report_runs set status='failed',failure_code=left(coalesce(p_failure_code,'provider_failure'),120),completed_at=now() where id=r.id;
    if r.mode='paid' then
      update public.purchases set consumed_by_report_run_id=null,consumed_at=null where consumed_by_report_run_id=r.id;
    end if;
  end if;
  return jsonb_build_object('status',case when p_success then 'complete' else 'failed' end,'mode',r.mode);
end $$;

create or replace function public.br_claim_report_email(p_run_id uuid, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.br_report_runs%rowtype;
begin
  select * into r from public.br_report_runs where id=p_run_id and user_id=p_user_id for update;
  if not found or r.status <> 'complete' then raise exception 'A completed report run is required.'; end if;
  if r.email_status='sent' then return jsonb_build_object('claimed',false,'already_sent',true,'email',r.email); end if;
  if r.email_status='sending' and r.email_claimed_at > now()-interval '2 minutes' then
    raise exception 'Report email delivery is already in progress.';
  end if;
  if r.email_attempts >= 3 then raise exception 'Report email retry limit reached.'; end if;
  update public.br_report_runs set email_status='sending',email_attempts=email_attempts+1,email_claimed_at=now() where id=r.id;
  return jsonb_build_object('claimed',true,'already_sent',false,'email',r.email);
end $$;

create or replace function public.br_finalize_report_email(p_run_id uuid, p_user_id uuid, p_success boolean, p_provider_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update public.br_report_runs set email_status=case when p_success then 'sent' else 'failed' end,
    email_provider_id=case when p_success then left(coalesce(p_provider_id,''),180) else email_provider_id end
    where id=p_run_id and user_id=p_user_id and status='complete';
  if not found then raise exception 'Completed report run not found.'; end if;
  return jsonb_build_object('status',case when p_success then 'sent' else 'failed' end);
end $$;

revoke all on function public.br_reserve_report_run(uuid,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.br_finalize_report_run(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.br_reserve_report_run(uuid,text,text,text,text,text) to service_role;
grant execute on function public.br_finalize_report_run(uuid,boolean,text) to service_role;
revoke all on function public.br_claim_report_email(uuid,uuid) from public, anon, authenticated;
revoke all on function public.br_finalize_report_email(uuid,uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.br_claim_report_email(uuid,uuid) to service_role;
grant execute on function public.br_finalize_report_email(uuid,uuid,boolean,text) to service_role;
