-- Relationship Stock Market rooms (run in Supabase SQL editor)
create table if not exists public.rsm_rooms (
  code text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at double precision,
  created_at timestamptz not null default now()
);

alter table public.rsm_rooms enable row level security;

drop policy if exists "rsm read" on public.rsm_rooms;
create policy "rsm read" on public.rsm_rooms for select using (true);

alter publication supabase_realtime add table public.rsm_rooms;
