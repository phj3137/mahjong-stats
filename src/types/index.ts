export type Player = {
  id: string;
  name: string;
  created_at: string;
};

export type GameMode = "online_1x" | "online_3x" | "offline_1x";

export type Game = {
  id: string;
  played_at: string;
  created_at: string;
  registered_by: string | null;
  mode: GameMode;
};

export type Seat = "동" | "서" | "남" | "북";

export type GameResult = {
  id: string;
  game_id: string;
  player_id: string;
  seat: Seat;
  is_dealer: boolean;
  raw_score: number;
  rank: number;
};

export type GameResultWithPlayer = GameResult & {
  players: Player;
};

export type GameWithResults = Game & {
  game_results: GameResultWithPlayer[];
  registrant?: Player | null;
};
