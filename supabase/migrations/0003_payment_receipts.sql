do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'record_file_kind'
  ) then
    create type public.record_file_kind as enum ('session_attachment', 'payment_receipt');
  end if;
end $$;

alter table public.record_files
  add column if not exists payment_id uuid references public.payments(id) on delete restrict,
  add column if not exists kind public.record_file_kind not null default 'session_attachment';

update public.record_files
set kind = 'session_attachment'
where kind is null;

create index if not exists record_files_payment_idx on public.record_files(payment_id);

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
