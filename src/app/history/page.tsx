"use client";

import HistoryIcon from "@mui/icons-material/History";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameWithResults, Player } from "@/types";

const RANK_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(iso));
}

type PeriodType = "all" | "monthly";

export default function HistoryPage() {
  const router = useRouter();
  const { settings } = useScoreSettings();
  const [games, setGames] = useState<GameWithResults[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterPlayerId, setFilterPlayerId] = useState("all");
  const [periodType, setPeriodType] = useState<PeriodType>("all");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    Promise.all([
      supabase
        .from("games")
        .select("*, game_results(*, players(*))")
        .order("played_at", { ascending: false }),
      supabase.from("players").select("*").order("name"),
    ]).then(([{ data: gamesData }, { data: playersData }]) => {
      setGames((gamesData as GameWithResults[]) ?? []);
      setPlayers(playersData ?? []);
      setIsLoading(false);
    });
  }, []);

  // 기록이 있는 연도 목록
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const g of games) {
      set.add(new Date(g.played_at).getFullYear());
    }
    set.add(currentYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [games]);

  // 기록이 있는 월 목록 (선택된 연도 기준)
  const availableMonths = useMemo(() => {
    const set = new Set<number>();
    for (const g of games) {
      const d = new Date(g.played_at);
      if (d.getFullYear() === year) set.add(d.getMonth() + 1);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [games, year]);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    const months = Array.from(
      new Set(
        games
          .filter((g) => new Date(g.played_at).getFullYear() === newYear)
          .map((g) => new Date(g.played_at).getMonth() + 1),
      ),
    ).sort((a, b) => b - a);
    if (months.length > 0 && !months.includes(month)) {
      setMonth(months[0]);
    }
  };

  const filtered = useMemo(() => {
    let result = games;

    // 플레이어 필터
    if (filterPlayerId !== "all") {
      result = result.filter((g) =>
        g.game_results.some((r) => r.player_id === filterPlayerId),
      );
    }

    // 기간 필터
    if (periodType === "monthly") {
      result = result.filter((g) => {
        const d = new Date(g.played_at);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }

    return result;
  }, [games, filterPlayerId, periodType, year, month]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", mb: 2 }}>
          <Typography component="h1" sx={{ flexGrow: 1, fontSize: 24, fontWeight: 900 }}>
            대국 내역
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {filtered.length}건
          </Typography>
        </Stack>

        {/* 기간 필터 */}
        <Tabs
          value={periodType}
          variant="fullWidth"
          onChange={(_, v) => setPeriodType(v)}
          sx={{ mb: 1.25 }}
        >
          <Tab label="전체" value="all" />
          <Tab label="월별" value="monthly" />
        </Tabs>

        {periodType === "monthly" && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.25 }}>
            <Select
              fullWidth
              size="small"
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}년
                </MenuItem>
              ))}
            </Select>
            <Select
              fullWidth
              size="small"
              value={availableMonths.includes(month) ? month : (availableMonths[availableMonths.length - 1] ?? month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {availableMonths.length === 0 ? (
                <MenuItem disabled value={month}>기록 없음</MenuItem>
              ) : (
                availableMonths.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}월
                  </MenuItem>
                ))
              )}
            </Select>
          </Stack>
        )}

        {/* 플레이어 Chip 필터 */}
        {players.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              overflowX: "auto",
              pb: 1.25,
              mb: 1.5,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <Chip
              label="전체"
              onClick={() => setFilterPlayerId("all")}
              color={filterPlayerId === "all" ? "primary" : "default"}
              variant={filterPlayerId === "all" ? "filled" : "outlined"}
              sx={{ flexShrink: 0 }}
            />
            {players.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                onClick={() => setFilterPlayerId(p.id)}
                color={filterPlayerId === p.id ? "primary" : "default"}
                variant={filterPlayerId === p.id ? "filled" : "outlined"}
                sx={{ flexShrink: 0 }}
              />
            ))}
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ pt: 6, textAlign: "center" }}>
            <HistoryIcon sx={{ color: "text.disabled", fontSize: 48, mb: 1 }} />
            <Typography color="text.secondary">
              {filterPlayerId === "all"
                ? "아직 기록된 대국이 없습니다."
                : "해당 플레이어의 대국이 없습니다."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {filtered.map((game) => {
              const sorted = [...game.game_results].sort((a, b) => a.rank - b.rank);

              return (
                <Card key={game.id} variant="outlined">
                  <CardActionArea onClick={() => router.push(`/games/${game.id}`)}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      {/* 헤더: 날짜, 모드, 대국코드 */}
                      <Stack
                        direction="row"
                        sx={{ alignItems: "center", gap: 0.5, mb: 1, flexWrap: "wrap" }}
                      >
                        <Chip label={formatDate(game.played_at)} size="small" />
                        <Chip
                          label={getModeLabel(game.mode, settings)}
                          size="small"
                          variant="outlined"
                        />
                        <Typography
                          color="text.disabled"
                          sx={{ fontSize: 10, ml: "auto" }}
                        >
                          {game.game_code}
                        </Typography>
                      </Stack>

                      {/* 4명 전원 순위 표시 (2x2 그리드) */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 0.75,
                        }}
                      >
                        {sorted.map((r) => {
                          const score = calculateScore(
                            r.raw_score,
                            r.rank,
                            game.mode,
                            settings,
                          );
                          const isWinner = r.rank === 1;
                          return (
                            <Stack
                              key={r.player_id}
                              direction="row"
                              sx={{ alignItems: "center", gap: 0.75 }}
                            >
                              <Typography
                                sx={{
                                  color: RANK_COLORS[r.rank - 1],
                                  fontSize: 18,
                                  fontWeight: 900,
                                  lineHeight: 1,
                                  minWidth: 22,
                                }}
                              >
                                {r.rank}
                              </Typography>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    fontWeight: isWinner ? 900 : 400,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {r.players?.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 10,
                                    color: score.appliedScore >= 0 ? "#2d6a4f" : "#c0392b",
                                    fontWeight: isWinner ? 700 : 400,
                                  }}
                                >
                                  {formatPoint(score.appliedScore, true)}pt
                                </Typography>
                              </Box>
                            </Stack>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
}
