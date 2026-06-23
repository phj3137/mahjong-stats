"use client";

import BarChartIcon from "@mui/icons-material/BarChart";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { getModeLabel } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameResult, Player } from "@/types";

type RawResult = GameResult & {
  players: Player;
  games: { played_at: string; mode: string };
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 800, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{value}</Typography>
        {sub && (
          <Typography color="text.secondary" sx={{ fontSize: 10.5 }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

const RANK_LABELS = ["1위", "2위", "3위", "4위"];
const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32", "#9e9e9e"];

export default function StatisticsPage() {
  const { settings } = useScoreSettings();
  const [allResults, setAllResults] = useState<RawResult[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState("all");

  useEffect(() => {
    Promise.all([
      supabase
        .from("game_results")
        .select("*, players(*), games(played_at, mode)"),
      supabase.from("players").select("*").order("name"),
    ]).then(([{ data: results }, { data: playerData }]) => {
      setAllResults((results as RawResult[]) ?? []);
      setPlayers(playerData ?? []);
      setIsLoading(false);
    });
  }, []);

  const totalGames = useMemo(() => {
    const ids = new Set(allResults.map((r) => r.game_id));
    return ids.size;
  }, [allResults]);

  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const seen = new Set<string>();
    for (const r of allResults) {
      if (seen.has(r.game_id)) continue;
      seen.add(r.game_id);
      counts[r.games.mode] = (counts[r.games.mode] ?? 0) + 1;
    }
    return counts;
  }, [allResults]);

  const playerResults = useMemo(() => {
    if (selectedPlayerId === "all") return [];
    return allResults.filter((r) => r.player_id === selectedPlayerId);
  }, [allResults, selectedPlayerId]);

  const rankCounts = useMemo(() => {
    const counts = [0, 0, 0, 0];
    for (const r of playerResults) {
      if (r.rank >= 1 && r.rank <= 4) counts[r.rank - 1]++;
    }
    return counts;
  }, [playerResults]);

  const playerGameCount = playerResults.length;
  const avgScore =
    playerGameCount > 0
      ? Math.round(
          playerResults.reduce((s, r) => s + r.raw_score, 0) / playerGameCount,
        )
      : 0;
  const avgRank =
    playerGameCount > 0
      ? (playerResults.reduce((s, r) => s + r.rank, 0) / playerGameCount).toFixed(2)
      : "-";

  const recentResults = useMemo(
    () =>
      [...playerResults]
        .sort((a, b) => new Date(b.games.played_at).getTime() - new Date(a.games.played_at).getTime())
        .slice(0, 10),
    [playerResults],
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900, mb: 2 }}>
          통계
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {/* 전체 통계 */}
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>전체</Typography>
              <Stack direction="row" spacing={1}>
                <StatCard label="총 대국" value={`${totalGames}국`} />
                <StatCard
                  label="온라인"
                  value={`${(modeCounts["online_1x"] ?? 0) + (modeCounts["online_3x"] ?? 0)}국`}
                  sub={getModeLabel("online_1x", settings)}
                />
                <StatCard
                  label={getModeLabel("offline_1x", settings)}
                  value={`${modeCounts["offline_1x"] ?? 0}국`}
                />
              </Stack>
            </Stack>

            <Divider />

            {/* 플레이어 선택 */}
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>플레이어별 통계</Typography>
              <Select
                displayEmpty
                fullWidth
                size="small"
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
              >
                <MenuItem value="all">플레이어 선택</MenuItem>
                {players.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {selectedPlayerId !== "all" && (
              <>
                {playerGameCount === 0 ? (
                  <Box sx={{ pt: 2, textAlign: "center" }}>
                    <BarChartIcon sx={{ color: "text.disabled", fontSize: 48, mb: 1 }} />
                    <Typography color="text.secondary">대국 기록이 없습니다.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                      <StatCard label="대국 수" value={`${playerGameCount}국`} />
                      <StatCard label="평균 점수" value={avgScore.toLocaleString()} />
                      <StatCard label="평균 순위" value={`${avgRank}위`} />
                    </Stack>

                    {/* 등수 분포 */}
                    <Stack spacing={0.75}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>등수 분포</Typography>
                      {rankCounts.map((count, i) => (
                        <Stack key={i} direction="row" sx={{ alignItems: "center", gap: 1 }}>
                          <Typography
                            sx={{ color: RANK_COLORS[i], fontSize: 13, fontWeight: 700, minWidth: 24 }}
                          >
                            {RANK_LABELS[i]}
                          </Typography>
                          <Box
                            sx={{
                              bgcolor: RANK_COLORS[i] + "33",
                              borderRadius: 999,
                              flex: 1,
                              height: 16,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                bgcolor: RANK_COLORS[i],
                                borderRadius: 999,
                                height: "100%",
                                width: `${playerGameCount > 0 ? (count / playerGameCount) * 100 : 0}%`,
                              }}
                            />
                          </Box>
                          <Typography sx={{ fontSize: 12, minWidth: 48, textAlign: "right" }}>
                            {count}회 ({playerGameCount > 0 ? Math.round((count / playerGameCount) * 100) : 0}%)
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    {/* 최근 성적 */}
                    <Stack spacing={0.75}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>최근 성적</Typography>
                      {recentResults.map((r, i) => (
                        <Stack
                          key={r.id}
                          direction="row"
                          sx={{ alignItems: "center", gap: 1 }}
                        >
                          <Typography color="text.secondary" sx={{ fontSize: 11, minWidth: 20 }}>
                            {i + 1}
                          </Typography>
                          <Typography
                            sx={{
                              color: RANK_COLORS[r.rank - 1],
                              fontSize: 13,
                              fontWeight: 900,
                              minWidth: 24,
                            }}
                          >
                            {r.rank}위
                          </Typography>
                          <Typography sx={{ flex: 1, fontSize: 12 }}>
                            {new Intl.DateTimeFormat("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                            }).format(new Date(r.games.played_at))}
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                            {r.raw_score.toLocaleString()}점
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
}
