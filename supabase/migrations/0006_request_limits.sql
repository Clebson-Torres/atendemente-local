create table if not exists public.request_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  identifier text not null,
  hits integer not null default 0,
  window_starts_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists request_limits_scope_identifier_idx
  on public.request_limits(scope, identifier);

create index if not exists request_limits_window_idx
  on public.request_limits(window_starts_at);

drop trigger if exists set_request_limits_updated_at on public.request_limits;
create trigger set_request_limits_updated_at
before update on public.request_limits
for each row execute function public.set_updated_at();
