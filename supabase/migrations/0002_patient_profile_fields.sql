alter table public.patients
  add column if not exists health_history text,
  add column if not exists medications_in_use text,
  add column if not exists emergency_phone text;
