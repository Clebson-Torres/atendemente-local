do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'appointment_confirmation_status'
  ) then
    create type public.appointment_confirmation_status as enum ('unconfirmed', 'confirmed', 'cancelled');
  end if;
end $$;

alter table public.appointments
  add column if not exists confirmation_status public.appointment_confirmation_status not null default 'unconfirmed';

update public.appointments
set confirmation_status = case
  when status = 'cancelled' then 'cancelled'::public.appointment_confirmation_status
  else 'unconfirmed'::public.appointment_confirmation_status
end
where confirmation_status is null
   or confirmation_status = 'unconfirmed';

create index if not exists appointments_confirmation_status_idx
  on public.appointments(confirmation_status);
