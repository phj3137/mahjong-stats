-- Fix silent delete failure: Supabase enables RLS by default.
-- Without explicit policies the anon key cannot delete rows.
-- These permissive policies restore full CRUD for the anon role
-- until authentication is introduced.

alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.game_results enable row level security;

create policy "anon_all_players" on public.players
  for all to anon using (true) with check (true);

create policy "anon_all_games" on public.games
  for all to anon using (true) with check (true);

create policy "anon_all_game_results" on public.game_results
  for all to anon using (true) with check (true);
