do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'patient_status'
  ) then
    create type public.patient_status as enum ('active', 'inactive');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'recurring_frequency'
  ) then
    create type public.recurring_frequency as enum ('weekly', 'biweekly');
  end if;
end $$;

alter table public.patients
  add column if not exists status public.patient_status not null default 'active';

create index if not exists patients_status_idx on public.patients(status);

create table if not exists public.recurring_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  frequency public.recurring_frequency not null,
  starts_on date not null,
  ends_on date,
  occurrences_count integer,
  start_time text not null,
  end_time text not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.appointments
  add column if not exists series_id uuid references public.recurring_series(id) on delete set null;

create index if not exists recurring_series_user_idx on public.recurring_series(user_id);
create index if not exists recurring_series_patient_idx on public.recurring_series(patient_id);
create index if not exists recurring_series_frequency_idx on public.recurring_series(frequency);
create index if not exists recurring_series_cancelled_idx on public.recurring_series(cancelled_at);
create index if not exists appointments_series_idx on public.appointments(series_id);

drop trigger if exists set_recurring_series_updated_at on public.recurring_series;
create trigger set_recurring_series_updated_at
before update on public.recurring_series
for each row execute function public.set_updated_at();

create or replace function public.validate_recurring_series_ownership()
returns trigger
language plpgsql
as $$
declare
  patient_owner uuid;
begin
  select user_id into patient_owner from public.patients where id = new.patient_id and deleted_at is null;

  if patient_owner is distinct from new.user_id then
    raise exception 'Patient ownership mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_recurring_series_ownership on public.recurring_series;
create trigger validate_recurring_series_ownership
before insert or update on public.recurring_series
for each row execute function public.validate_recurring_series_ownership();

create or replace function public.validate_patient_and_appointment_ownership()
returns trigger
language plpgsql
as $$
declare
  patient_owner uuid;
  appointment_owner uuid;
  appointment_patient uuid;
  payment_owner uuid;
  payment_appointment uuid;
  series_owner uuid;
  series_patient uuid;
begin
  if tg_table_name = 'appointments' then
    select user_id into patient_owner from public.patients where id = new.patient_id and deleted_at is null;

    if patient_owner is distinct from new.user_id then
      raise exception 'Patient ownership mismatch';
    end if;

    if new.series_id is not null then
      select user_id, patient_id into series_owner, series_patient
      from public.recurring_series
      where id = new.series_id and cancelled_at is null;

      if series_owner is distinct from new.user_id then
        raise exception 'Recurring series ownership mismatch';
      end if;

      if series_patient is distinct from new.patient_id then
        raise exception 'Recurring series patient mismatch';
      end if;
    end if;

    return new;
  end if;

  select user_id into patient_owner from public.patients where id = new.patient_id and deleted_at is null;
  select user_id, patient_id into appointment_owner, appointment_patient
  from public.appointments where id = new.appointment_id and deleted_at is null;

  if patient_owner is distinct from new.user_id then
    raise exception 'Patient ownership mismatch';
  end if;

  if appointment_owner is distinct from new.user_id then
    raise exception 'Appointment ownership mismatch';
  end if;

  if appointment_patient is distinct from new.patient_id then
    raise exception 'Appointment patient mismatch';
  end if;

  if tg_table_name = 'record_files' and new.payment_id is not null then
    select user_id, appointment_id into payment_owner, payment_appointment
    from public.payments where id = new.payment_id and deleted_at is null;

    if payment_owner is distinct from new.user_id then
      raise exception 'Payment ownership mismatch';
    end if;

    if payment_appointment is distinct from new.appointment_id then
      raise exception 'Payment appointment mismatch';
    end if;
  end if;

  return new;
end;
$$;

alter table public.recurring_series enable row level security;

create policy "recurring_series_all_own" on public.recurring_series
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
