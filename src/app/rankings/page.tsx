"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint } from "@/lib/scoring";
import type { ScoreMultiplierSettings } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameMode, GameResult, Player } from "@/types";

type RawResult = GameResult & {
  players: Player;
  games: { played_at: string; mode: GameMode };
};

type RankEntry = {
  player: Player;
  gameCount: number;
  totalScore: number;
  totalRawScore: number;
  totalJunScore: number;
  totalAppliedScore: number;
  totalUma: number;
  avgJunScore: number;
  avgAppliedScore: number;
  avgUma: number;
  avgRank: number;
  winRate: number;
  topTwoRate: number;
  rankCounts: [number, number, number, number];
  latestPlayedAt: string;
};

type FilterType = "alltime" | "monthly" | "quarterly";

type HistoryPoint = {
  key: string;
  label: string;
  rankMap: Map<string, number>;
};

const HISTORY_COLORS = ["#2d6a4f", "#c0392b", "#1565c0", "#ed6c02", "#7b1fa2"];

const PODIUM_CONFIG = {
  1: { bg: "#fff8e1", border: "#b5892a", color: "#7d5a00", label: "🥇", height: 88 },
  2: { bg: "#f5f5f5", border: "#8c9aa3", color: "#4a6370", label: "🥈", height: 64 },
  3: { bg: "#fbe9e7", border: "#8b6553", color: "#5d3c2e", label: "🥉", height: 48 },
} as const;

function PodiumCard({
  entry,
  rank,
  avgScore,
}: {
  entry: RankEntry;
  rank: 1 | 2 | 3;
  avgScore: string;
}) {
  const cfg = PODIUM_CONFIG[rank];
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Typography sx={{ fontSize: 18, mb: 0.5 }}>{cfg.label}</Typography>
      <Avatar
        sx={{
          bgcolor: cfg.border,
          width: 40,
          height: 40,
          fontSize: 16,
          fontWeight: 900,
          mb: 0.5,
          border: `2px solid ${cfg.border}`,
        }}
      >
        {entry.player.name[0]}
      </Avatar>
      <Typography
        sx={{ fontSize: 12, fontWeight: 800, color: cfg.color, mb: 0.25, textAlign: "center" }}
      >
        {entry.player.name}
      </Typography>
      <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 0.5 }}>
        {avgScore}pt
      </Typography>
      <Box
        sx={{
          width: "100%",
          height: cfg.height,
          bgcolor: cfg.bg,
          border: `2px solid ${cfg.border}`,
          borderBottom: "none",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 900, color: cfg.color }}>
          {rank}
        </Typography>
      </Box>
    </Box>
  );
}
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const currentQuarter = Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4;

function getDateRange(
  type: FilterType,
  year: number,
  month: number,
  quarter: 1 | 2 | 3 | 4,
): { from: Date | null; to: Date | null } {
  if (type === "alltime") return { from: null, to: null };
  if (type === "monthly") {
    return {
      from: new Date(year, month - 1, 1),
      to: new Date(year, month, 1),
    };
  }

  const startMonth = (quarter - 1) * 3;
  return {
    from: new Date(year, startMonth, 1),
    to: new Date(year, startMonth + 3, 1),
  };
}

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function aggregate(
  results: RawResult[],
  settings: ScoreMultiplierSettings,
): RankEntry[] {
  const map = new Map<string, RankEntry>();

  for (const result of results) {
    const playerId = result.player_id;
    const score = calculateScore(result.raw_score, result.rank, result.games.mode, settings);

    if (!map.has(playerId)) {
      map.set(playerId, {
        player: result.players,
        gameCount: 0,
        totalScore: 0,
        totalRawScore: 0,
        totalJunScore: 0,
        totalAppliedScore: 0,
        totalUma: 0,
        avgJunScore: 0,
        avgAppliedScore: 0,
        avgUma: 0,
        avgRank: 0,
        winRate: 0,
        topTwoRate: 0,
        rankCounts: [0, 0, 0, 0],
        latestPlayedAt: result.games.played_at,
      });
    }

    const entry = map.get(playerId)!;
    entry.gameCount += 1;
    entry.totalScore += score.appliedScore;
    entry.totalRawScore += result.raw_score;
    entry.totalJunScore += score.junScore;
    entry.totalAppliedScore += score.appliedScore;
    entry.totalUma += score.uma;
    entry.avgRank += result.rank;
    if (result.rank >= 1 && result.rank <= 4) {
      entry.rankCounts[result.rank - 1] += 1;
    }
    if (new Date(result.games.played_at) > new Date(entry.latestPlayedAt)) {
      entry.latestPlayedAt = result.games.played_at;
    }
  }

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      avgJunScore: entry.totalJunScore / entry.gameCount,
      avgAppliedScore: entry.totalAppliedScore / entry.gameCount,
      avgUma: entry.totalUma / entry.gameCount,
      avgRank: Math.round((entry.avgRank / entry.gameCount) * 100) / 100,
      winRate: entry.rankCounts[0] / entry.gameCount,
      topTwoRate: (entry.rankCounts[0] + entry.rankCounts[1]) / entry.gameCount,
    }))
    .sort((a, b) => {
      if (b.avgAppliedScore !== a.avgAppliedScore) {
        return b.avgAppliedScore - a.avgAppliedScore;
      }
      if (b.gameCount !== a.gameCount) return b.gameCount - a.gameCount;
      return b.totalAppliedScore - a.totalAppliedScore;
    });
}

function filterByRange(
  results: RawResult[],
  range: { from: Date | null; to: Date | null },
) {
  return results.filter((result) => {
    const playedAt = new Date(result.games.played_at);
    if (range.from && playedAt < range.from) return false;
    if (range.to && playedAt >= range.to) return false;
    return true;
  });
}

function buildGameHistory(
  results: RawResult[],
  settings: ScoreMultiplierSettings,
): HistoryPoint[] {
  const gameMap = new Map<string, RawResult[]>();
  for (const result of results) {
    gameMap.set(result.game_id, [...(gameMap.get(result.game_id) ?? []), result]);
  }

  const games = Array.from(gameMap.entries())
    .map(([gameId, gameResults]) => ({
      gameId,
      results: gameResults,
      playedAt: gameResults[0]?.games.played_at ?? "",
    }))
    .sort((a, b) => {
      const dateDiff = new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.gameId.localeCompare(b.gameId);
    });

  const cumulative: RawResult[] = [];

  return games.map((game, index) => {
    cumulative.push(...game.results);
    const ranking = aggregate(cumulative, settings);
    const dateLabel = game.playedAt
      ? new Intl.DateTimeFormat("ko-KR", {
          month: "numeric",
          day: "numeric",
        }).format(new Date(game.playedAt))
      : `${index + 1}`;

    return {
      key: game.gameId,
      label: `${index + 1}국\n${dateLabel}`,
      rankMap: new Map(ranking.map((entry, rankIndex) => [entry.player.id, rankIndex + 1])),
    };
  });
}

function RankingHistory({
  points,
  entries,
  unitLabel,
}: {
  points: HistoryPoint[];
  entries: RankEntry[];
  unitLabel: string;
}) {
  const players = entries.slice(0, 5);
  const visiblePoints = points.slice(-8);

  if (players.length === 0 || visiblePoints.length < 2) {
    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <ShowChartIcon color="disabled" fontSize="small" />
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            순위 히스토리를 표시하려면 대국 데이터가 더 필요합니다.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const width = 360;
  const height = 178;
  const padding = { top: 16, right: 12, bottom: 34, left: 30 };
  const maxRank = Math.max(
    4,
    ...visiblePoints.flatMap((point) =>
      players.map((entry) => point.rankMap.get(entry.player.id) ?? players.length + 1),
    ),
  );
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) =>
    padding.left +
    (visiblePoints.length === 1 ? 0 : (chartWidth * index) / (visiblePoints.length - 1));
  const yFor = (rank: number) =>
    padding.top + ((rank - 1) / Math.max(1, maxRank - 1)) * chartHeight;

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <ShowChartIcon color="primary" fontSize="small" />
          <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 800 }}>
            순위 히스토리
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 11 }}>
            최근 {visiblePoints.length}개 {unitLabel}
          </Typography>
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          <svg
            aria-label="순위 히스토리 차트"
            height={height}
            role="img"
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
          >
            {[1, 2, 3, 4].map((rank) => (
              <g key={rank}>
                <line
                  stroke="#e0e0e0"
                  strokeDasharray="3 3"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={yFor(rank)}
                  y2={yFor(rank)}
                />
                <text
                  fill="#666"
                  fontSize="10"
                  textAnchor="end"
                  x={padding.left - 8}
                  y={yFor(rank) + 3}
                >
                  {rank}
                </text>
              </g>
            ))}

            {visiblePoints.map((point, index) => (
              <text
                key={point.key}
                fill="#777"
                fontSize="10"
                textAnchor="middle"
                x={xFor(index)}
                y={height - 10}
              >
                {point.label.split("\n").map((line, lineIndex) => (
                  <tspan
                    key={line}
                    dy={lineIndex === 0 ? 0 : 11}
                    x={xFor(index)}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            ))}

            {players.map((entry, playerIndex) => {
              const linePoints = visiblePoints
                .map((point, pointIndex) => {
                  const rank = point.rankMap.get(entry.player.id);
                  if (!rank) return null;
                  return {
                    x: xFor(pointIndex),
                    y: yFor(rank),
                    rank,
                  };
                })
                .filter((point): point is { x: number; y: number; rank: number } => !!point);

              if (linePoints.length === 0) return null;
              const color = HISTORY_COLORS[playerIndex % HISTORY_COLORS.length];

              return (
                <g key={entry.player.id}>
                  {linePoints.length > 1 && (
                    <polyline
                      fill="none"
                      points={linePoints.map((point) => `${point.x},${point.y}`).join(" ")}
                      stroke={color}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  )}
                  {linePoints.map((point, index) => (
                    <g key={`${entry.player.id}-${index}`}>
                      <circle cx={point.x} cy={point.y} fill={color} r="4" />
                      <text
                        fill="#fff"
                        fontSize="7"
                        fontWeight="700"
                        textAnchor="middle"
                        x={point.x}
                        y={point.y + 2.5}
                      >
                        {point.rank}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </Box>

        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
          {players.map((entry, index) => (
            <Chip
              key={entry.player.id}
              label={entry.player.name}
              size="small"
              sx={{
                borderColor: HISTORY_COLORS[index % HISTORY_COLORS.length],
                color: HISTORY_COLORS[index % HISTORY_COLORS.length],
              }}
              variant="outlined"
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function RankingsPage() {
  const { settings } = useScoreSettings();
  const [allResults, setAllResults] = useState<RawResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterType, setFilterType] = useState<FilterType>("monthly");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(currentQuarter);

  useEffect(() => {
    supabase
      .from("game_results")
      .select("*, players(*), games(played_at, mode)")
      .then(({ data }) => {
        setAllResults((data as RawResult[]) ?? []);
        setIsLoading(false);
      });
  }, []);

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    for (const result of allResults) {
      yearSet.add(new Date(result.games.played_at).getFullYear());
    }
    yearSet.add(currentYear);
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allResults]);

  const filteredResults = useMemo(() => {
    return filterByRange(allResults, getDateRange(filterType, year, month, quarter));
  }, [allResults, filterType, month, quarter, year]);

  const currentRanking = useMemo(
    () => aggregate(filteredResults, settings),
    [filteredResults, settings],
  );
  const historyPoints = useMemo(
    () => buildGameHistory(filteredResults, settings),
    [filteredResults, settings],
  );

  const selectedPeriodLabel =
    filterType === "alltime"
      ? "통산"
      : filterType === "monthly"
        ? `${year}년 ${month}월`
        : `${year}년 ${quarter}분기`;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", mb: 2 }}>
          <Typography component="h1" sx={{ flex: 1, fontSize: 24, fontWeight: 900 }}>
            랭킹
          </Typography>
          <Chip label={selectedPeriodLabel} size="small" />
        </Stack>

        <Tabs
          value={filterType}
          variant="fullWidth"
          onChange={(_, value) => setFilterType(value)}
          sx={{ mb: 1.5 }}
        >
          <Tab label="통산" value="alltime" />
          <Tab label="월별" value="monthly" />
          <Tab label="분기별" value="quarterly" />
        </Tabs>

        {filterType !== "alltime" && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Select
              fullWidth
              size="small"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {years.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}년
                </MenuItem>
              ))}
            </Select>
            {filterType === "monthly" ? (
              <Select
                fullWidth
                size="small"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}월
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Select
                fullWidth
                size="small"
                value={quarter}
                onChange={(event) => setQuarter(Number(event.target.value) as 1 | 2 | 3 | 4)}
              >
                {([1, 2, 3, 4] as const).map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}분기
                  </MenuItem>
                ))}
              </Select>
            )}
          </Stack>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : currentRanking.length === 0 ? (
          <Box sx={{ pt: 6, textAlign: "center" }}>
            <EmojiEventsIcon sx={{ color: "text.disabled", fontSize: 48, mb: 1 }} />
            <Typography color="text.secondary">해당 기간의 데이터가 없습니다.</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {/* 포디엄 */}
            {currentRanking.length >= 3 && (
              <Box>
                <Stack
                  direction="row"
                  sx={{ alignItems: "flex-end", gap: 0.5, pb: 0 }}
                >
                  {/* 순서: 2위(왼쪽) - 1위(가운데) - 3위(오른쪽) */}
                  <PodiumCard
                    entry={currentRanking[1]}
                    rank={2}
                    avgScore={formatPoint(currentRanking[1].avgAppliedScore, true)}
                  />
                  <PodiumCard
                    entry={currentRanking[0]}
                    rank={1}
                    avgScore={formatPoint(currentRanking[0].avgAppliedScore, true)}
                  />
                  <PodiumCard
                    entry={currentRanking[2]}
                    rank={3}
                    avgScore={formatPoint(currentRanking[2].avgAppliedScore, true)}
                  />
                </Stack>
                <Box
                  sx={{
                    height: 4,
                    bgcolor: "divider",
                    borderRadius: "0 0 6px 6px",
                  }}
                />
              </Box>
            )}

            <TableContainer
              component={Paper}
              elevation={0}
              variant="outlined"
              sx={{ overflowX: "auto" }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: 1120 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 130 }}>이름</TableCell>
                    <TableCell align="right">대국수</TableCell>
                    <TableCell align="right">총점</TableCell>
                    <TableCell align="right">평균순점</TableCell>
                    <TableCell align="right">반영평균</TableCell>
                    <TableCell align="right">평균우마</TableCell>
                    <TableCell align="right">평균순위</TableCell>
                    <TableCell align="right">승률</TableCell>
                    <TableCell align="right">연대율</TableCell>
                    <TableCell align="right">1위</TableCell>
                    <TableCell align="right">2위</TableCell>
                    <TableCell align="right">3위</TableCell>
                    <TableCell align="right">4위</TableCell>
                    <TableCell align="right">최근 대국일</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRanking.map((entry, index) => (
                    <TableRow key={entry.player.id} hover>
                      <TableCell>
                        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "text.secondary", fontSize: 12, minWidth: 18 }}>
                            {index + 1}
                          </Typography>
                          <Avatar
                            sx={{ bgcolor: "primary.main", fontSize: 12, height: 28, width: 28 }}
                          >
                            {entry.player.name[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {entry.player.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{entry.gameCount}</TableCell>
                      <TableCell align="right">{formatPoint(entry.totalScore, true)}</TableCell>
                      <TableCell align="right">{formatPoint(entry.avgJunScore, true)}</TableCell>
                      <TableCell align="right">{formatPoint(entry.avgAppliedScore, true)}</TableCell>
                      <TableCell align="right">{formatPoint(entry.avgUma, true)}</TableCell>
                      <TableCell align="right">{entry.avgRank.toFixed(2)}</TableCell>
                      <TableCell align="right">{formatPercent(entry.winRate)}</TableCell>
                      <TableCell align="right">{formatPercent(entry.topTwoRate)}</TableCell>
                      <TableCell align="right">{entry.rankCounts[0]}</TableCell>
                      <TableCell align="right">{entry.rankCounts[1]}</TableCell>
                      <TableCell align="right">{entry.rankCounts[2]}</TableCell>
                      <TableCell align="right">{entry.rankCounts[3]}</TableCell>
                      <TableCell align="right">{formatDate(entry.latestPlayedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Paper elevation={0} sx={{ bgcolor: "background.paper", p: 1.5 }}>
              <Typography color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.6 }}>
                반영평균 기준 정렬 · 평균순점은 (점수 - 30,000) / 1,000 · 우마는 1위
                +30 / 2위 +10 / 3위 -10 / 4위 -30 · 오카는 1위 +20 기준
              </Typography>
            </Paper>

            <RankingHistory
              entries={currentRanking}
              points={historyPoints}
              unitLabel="대국"
            />
          </Stack>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
}
