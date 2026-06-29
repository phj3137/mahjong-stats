-- seat 컬럼을 nullable로 변경 (동점자가 없을 때는 자리 입력 불필요)
ALTER TABLE public.game_results
  ALTER COLUMN seat DROP NOT NULL;

ALTER TABLE public.game_results
  DROP CONSTRAINT IF EXISTS game_results_seat_check;

ALTER TABLE public.game_results
  ADD CONSTRAINT game_results_seat_check
  CHECK (seat IS NULL OR seat IN ('동', '서', '남', '북'));
