-- ============================================================
-- 초기 스키마
-- 이후 마이그레이션:
--   20260623153000 - game_results.final_score → raw_score
--   20260623160000 - games.game_code 컬럼 추가
-- ============================================================

-- 플레이어
create table if not exists public.players (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now()
);

-- 게임
create table if not exists public.games (
  id            uuid        primary key default gen_random_uuid(),
  mode          text        not null check (mode in ('online_1x', 'online_3x', 'offline_1x')),
  played_at     timestamptz not null,
  created_at    timestamptz not null default now(),
  registered_by uuid        references public.players(id) on delete set null
);

-- 게임 결과
-- (final_score는 20260623153000 마이그레이션에서 raw_score로 rename됨)
create table if not exists public.game_results (
  id          uuid    primary key default gen_random_uuid(),
  game_id     uuid    not null references public.games(id) on delete cascade,
  player_id   uuid    not null references public.players(id) on delete cascade,
  seat        text    not null check (seat in ('동', '서', '남', '북')),
  is_dealer   boolean not null default false,
  final_score integer not null,
  rank        integer not null check (rank between 1 and 4)
);
