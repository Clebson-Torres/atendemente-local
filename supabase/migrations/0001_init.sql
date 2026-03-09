create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key,
  email text not null,
  full_name text,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.payment_status as enum ('pending', 'paid', 'cancelled');
create type public.payment_method as enum ('pix', 'cash', 'card', 'bank_transfer', 'other');
create type public.audit_action as enum ('login', 'logout', 'file_upload', 'file_download', 'patient_export', 'delete', 'update');

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  session_price_cents integer not null default 0,
  quick_notes text,
  cancel_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete restrict,
  status public.payment_status not null default 'pending',
  method public.payment_method not null default 'other',
  paid_at timestamptz,
  amount_received_cents integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.session_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid not null unique references public.appointments(id) on delete restrict,
  encrypted_payload text not null,
  iv text not null,
  auth_tag text not null,
  key_version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.record_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  byte_size integer not null,
  uploaded_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists patients_user_idx on public.patients(user_id);
create index if not exists patients_deleted_idx on public.patients(deleted_at);
create index if not exists appointments_user_idx on public.appointments(user_id);
create index if not exists appointments_patient_idx on public.appointments(patient_id);
create index if not exists appointments_starts_at_idx on public.appointments(starts_at);
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists appointments_deleted_idx on public.appointments(deleted_at);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_deleted_idx on public.payments(deleted_at);
create index if not exists session_records_user_idx on public.session_records(user_id);
create index if not exists session_records_patient_idx on public.session_records(patient_id);
create index if not exists session_records_deleted_idx on public.session_records(deleted_at);
create index if not exists record_files_user_idx on public.record_files(user_id);
create index if not exists record_files_patient_idx on public.record_files(patient_id);
create index if not exists record_files_appointment_idx on public.record_files(appointment_id);
create index if not exists record_files_deleted_idx on public.record_files(deleted_at);
create index if not exists audit_logs_user_idx on public.audit_logs(user_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger set_session_records_updated_at
before update on public.session_records
for each row execute function public.set_updated_at();

create or replace function public.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute procedure public.sync_auth_user();

create or replace function public.validate_patient_and_appointment_ownership()
returns trigger
language plpgsql
as $$
declare
  patient_owner uuid;
  appointment_owner uuid;
  appointment_patient uuid;
begin
  if tg_table_name = 'appointments' then
    select user_id into patient_owner from public.patients where id = new.patient_id and deleted_at is null;

    if patient_owner is distinct from new.user_id then
      raise exception 'Patient ownership mismatch';
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

  return new;
end;
$$;

drop trigger if exists validate_appointment_ownership on public.appointments;
create trigger validate_appointment_ownership
before insert or update on public.appointments
for each row execute function public.validate_patient_and_appointment_ownership();

drop trigger if exists validate_session_record_ownership on public.session_records;
create trigger validate_session_record_ownership
before insert or update on public.session_records
for each row execute function public.validate_patient_and_appointment_ownership();

drop trigger if exists validate_record_file_ownership on public.record_files;
create trigger validate_record_file_ownership
before insert or update on public.record_files
for each row execute function public.validate_patient_and_appointment_ownership();

create or replace function public.validate_payment_ownership()
returns trigger
language plpgsql
as $$
declare
  appointment_owner uuid;
begin
  select user_id into appointment_owner from public.appointments where id = new.appointment_id and deleted_at is null;

  if appointment_owner is distinct from new.user_id then
    raise exception 'Appointment ownership mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_payment_ownership on public.payments;
create trigger validate_payment_ownership
before insert or update on public.payments
for each row execute function public.validate_payment_ownership();

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.session_records enable row level security;
alter table public.record_files enable row level security;
alter table public.audit_logs enable row level security;

create policy "users_select_own" on public.users
for select to authenticated
using (auth.uid() = id);

create policy "users_update_own" on public.users
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "patients_all_own" on public.patients
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "appointments_all_own" on public.appointments
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "payments_all_own" on public.payments
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "session_records_all_own" on public.session_records
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "record_files_all_own" on public.record_files
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "audit_logs_select_own" on public.audit_logs
for select to authenticated
using (auth.uid() = user_id);

create policy "audit_logs_insert_own" on public.audit_logs
for insert to authenticated
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-record-files',
  'private-record-files',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
