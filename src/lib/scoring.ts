import type { GameMode } from "@/types";

export const TOTAL_RAW_SCORE = 100000;
export const RETURN_SCORE = 30000;

export type ScoreMultiplierSettings = {
  online: number;
  offline: number;
};

export const DEFAULT_SCORE_MULTIPLIERS: ScoreMultiplierSettings = {
  online: 1 / 3,
  offline: 1,
};

export const UMA_BY_RANK: Record<number, number> = {
  1: 30,
  2: 10,
  3: -10,
  4: -30,
};

export function getOka(rank: number) {
  return rank === 1 ? 20 : 0;
}

export function getModeMultiplier(
  mode: GameMode,
  settings: ScoreMultiplierSettings = DEFAULT_SCORE_MULTIPLIERS,
) {
  return mode === "offline_1x" ? settings.offline : settings.online;
}

export function calculateScore(
  rawScore: number,
  rank: number,
  mode: GameMode,
  settings: ScoreMultiplierSettings = DEFAULT_SCORE_MULTIPLIERS,
) {
  const junScore = (rawScore - RETURN_SCORE) / 1000;
  const uma = UMA_BY_RANK[rank] ?? 0;
  const oka = getOka(rank);
  const finalScore = junScore + uma + oka;
  const appliedScore = finalScore * getModeMultiplier(mode, settings);

  return {
    rawScore,
    rank,
    junScore,
    uma,
    oka,
    finalScore,
    appliedScore,
  };
}

export function formatPoint(value: number, signed = false) {
  const rounded = Math.round(value * 10) / 10;
  const text = rounded.toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
  });

  if (signed && rounded > 0) return `+${text}`;
  return text;
}

export function formatMultiplier(value: number) {
  if (Math.abs(value - 1 / 3) < 0.0001) return "1/3";

  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

export function getModeLabel(
  mode: GameMode,
  settings: ScoreMultiplierSettings = DEFAULT_SCORE_MULTIPLIERS,
) {
  const multiplier = formatMultiplier(getModeMultiplier(mode, settings));
  if (mode === "offline_1x") return `오프라인 ${multiplier}배`;
  return `온라인 ${multiplier}배`;
}
