"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameMode, Player } from "@/types";

type PlayerResult = {
  id: string;
  game_id: string;
  player_id: string;
  seat: string;
  is_dealer: boolean;
  raw_score: number;
  rank: number;
  games: { played_at: string; mode: GameMode; game_code: string };
};

const RANK_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];
const RANK_LABELS = ["1위", "2위", "3위", "4위"];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 1.25 }}>
      <Typography color="text.secondary" sx={{ fontSize: 10, fontWeight: 800, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{value}</Typography>
      {sub && (
        <Typography color="text.secondary" sx={{ fontSize: 10 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { settings } = useScoreSettings();

  const [player, setPlayer] = useState<Player | null>(null);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("players").select("*").eq("id", id).single(),
      supabase
        .from("game_results")
        .select("*, games(played_at, mode, game_code)")
        .eq("player_id", id),
    ]).then(([{ data: playerData }, { data: resultsData }]) => {
      setPlayer(playerData as Player);
      const sorted = ((resultsData as PlayerResult[]) ?? []).sort(
        (a, b) =>
          new Date(b.games.played_at).getTime() -
          new Date(a.games.played_at).getTime(),
      );
      setResults(sorted);
      setIsLoading(false);
    });
  }, [id]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const rankCounts: [number, number, number, number] = [0, 0, 0, 0];
    let totalRawScore = 0;
    let totalAppliedScore = 0;
    let totalRank = 0;

    for (const r of results) {
      if (r.rank >= 1 && r.rank <= 4) rankCounts[r.rank - 1]++;
      totalRawScore += r.raw_score;
      totalRank += r.rank;
      totalAppliedScore += calculateScore(
        r.raw_score,
        r.rank,
        r.games.mode,
        settings,
      ).appliedScore;
    }

    const gameCount = results.length;
    return {
      gameCount,
      rankCounts,
      winRate: rankCounts[0] / gameCount,
      topTwoRate: (rankCounts[0] + rankCounts[1]) / gameCount,
      avgRank: totalRank / gameCount,
      avgRawScore: Math.round(totalRawScore / gameCount),
      totalAppliedScore,
      avgAppliedScore: totalAppliedScore / gameCount,
    };
  }, [results, settings]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", mb: 2 }}>
          <IconButton edge="start" sx={{ mr: 1 }} onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h1" sx={{ flexGrow: 1, fontSize: 20, fontWeight: 900 }}>
            선수 통계
          </Typography>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : !player ? (
          <Typography color="text.secondary" sx={{ pt: 4, textAlign: "center" }}>
            선수를 찾을 수 없습니다.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            {/* 선수 정보 */}
            <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 56,
                  height: 56,
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                {player.name[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>
                  {player.name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  총 {stats?.gameCount ?? 0}국 참가
                </Typography>
              </Box>
            </Stack>

            {!stats ? (
              <Box sx={{ pt: 2, textAlign: "center" }}>
                <BarChartIcon sx={{ color: "text.disabled", fontSize: 48, mb: 1 }} />
                <Typography color="text.secondary">대국 기록이 없습니다.</Typography>
              </Box>
            ) : (
              <>
                {/* 주요 통계 */}
                <Stack direction="row" spacing={0.75}>
                  <StatCard
                    label="총점"
                    value={formatPoint(stats.totalAppliedScore, true) + "pt"}
                  />
                  <StatCard
                    label="평균순점"
                    value={stats.avgRawScore.toLocaleString()}
                  />
                  <StatCard
                    label="평균순위"
                    value={`${stats.avgRank.toFixed(2)}위`}
                  />
                </Stack>
                <Stack direction="row" spacing={0.75}>
                  <StatCard
                    label="반영평균"
                    value={formatPoint(stats.avgAppliedScore, true) + "pt"}
                  />
                  <StatCard
                    label="승률"
                    value={`${Math.round(stats.winRate * 1000) / 10}%`}
                    sub={`${stats.rankCounts[0]}승`}
                  />
                  <StatCard
                    label="연대율"
                    value={`${Math.round(stats.topTwoRate * 1000) / 10}%`}
                    sub={`${stats.rankCounts[0] + stats.rankCounts[1]}회`}
                  />
                </Stack>

                {/* 등수 분포 */}
                <Stack spacing={0.75}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>등수 분포</Typography>
                  {stats.rankCounts.map((count, i) => (
                    <Stack key={i} direction="row" sx={{ alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          color: RANK_COLORS[i],
                          fontSize: 12,
                          fontWeight: 700,
                          minWidth: 24,
                        }}
                      >
                        {RANK_LABELS[i]}
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: RANK_COLORS[i] + "33",
                          borderRadius: 999,
                          flex: 1,
                          height: 14,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: RANK_COLORS[i],
                            borderRadius: 999,
                            height: "100%",
                            width: `${stats.gameCount > 0 ? (count / stats.gameCount) * 100 : 0}%`,
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: 11, minWidth: 64, textAlign: "right" }}>
                        {count}회 (
                        {stats.gameCount > 0
                          ? Math.round((count / stats.gameCount) * 100)
                          : 0}
                        %)
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Divider />

                {/* 최근 대국 */}
                <Stack spacing={0.75}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                    최근 대국{" "}
                    <Typography component="span" color="text.secondary" sx={{ fontSize: 12, fontWeight: 400 }}>
                      (최근 20국)
                    </Typography>
                  </Typography>
                  {results.slice(0, 20).map((r) => {
                    const score = calculateScore(
                      r.raw_score,
                      r.rank,
                      r.games.mode,
                      settings,
                    );
                    return (
                      <Stack
                        key={r.id}
                        direction="row"
                        sx={{ alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          sx={{
                            color: RANK_COLORS[r.rank - 1],
                            fontSize: 15,
                            fontWeight: 900,
                            minWidth: 24,
                          }}
                        >
                          {r.rank}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 11, flex: 1 }}>
                          {new Intl.DateTimeFormat("ko-KR", {
                            month: "numeric",
                            day: "numeric",
                          }).format(new Date(r.games.played_at))}
                          {" · "}
                          {r.games.game_code}
                          {r.is_dealer && (
                            <Typography
                              component="span"
                              sx={{ fontSize: 10, color: "#b5892a", ml: 0.5 }}
                            >
                              기가
                            </Typography>
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: 12 }}>
                          {r.raw_score.toLocaleString()}점
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: score.appliedScore >= 0 ? "#2d6a4f" : "#c0392b",
                            minWidth: 52,
                            textAlign: "right",
                          }}
                        >
                          {formatPoint(score.appliedScore, true)}pt
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </>
            )}
          </Stack>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
}
