alter table public.games
add column if not exists game_code text;

with numbered_games as (
  select
    id,
    to_char(played_at::date, 'YYYYMMDD') as played_date,
    row_number() over (
      partition by played_at::date
      order by created_at, id
    ) as game_number
  from public.games
)
update public.games as games
set game_code = numbered_games.played_date || '-' || lpad(numbered_games.game_number::text, 2, '0')
from numbered_games
where games.id = numbered_games.id
  and games.game_code is null;

alter table public.games
alter column game_code set not null;

create unique index if not exists games_game_code_key
on public.games (game_code);
