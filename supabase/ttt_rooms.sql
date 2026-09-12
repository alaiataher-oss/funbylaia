-- Tic-Tac-Toe rooms for funbylaia (run in Supabase SQL editor)
create table if not exists public.ttt_rooms (
  code text primary key,
  board jsonb not null default '[]'::jsonb,
  turn text default 'X',
  status text not null default 'waiting',
  winner text,
  winning_line jsonb,
  first_mark text default 'X',
  scores jsonb not null default '{"X":0,"O":0,"draws":0}'::jsonb,
  rematch_x boolean not null default false,
  rematch_o boolean not null default false,
  player_x_id text,
  player_o_id text,
  ready_x boolean not null default false,
  ready_o boolean not null default false,
  last_seen_x double precision,
  last_seen_o double precision,
  host_id text,
  updated_at double precision,
  created_at timestamptz not null default now()
);

alter table public.ttt_rooms add column if not exists host_id text;

alter table public.ttt_rooms enable row level security;

-- Clients read via anon for Realtime; writes go through service role (FastAPI).
drop policy if exists "ttt read" on public.ttt_rooms;
create policy "ttt read" on public.ttt_rooms for select using (true);

-- Enable Realtime
alter publication supabase_realtime add table public.ttt_rooms;
