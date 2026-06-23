"use client";

import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameWithResults } from "@/types";

export default function Home() {
  const { settings } = useScoreSettings();
  const [recentGames, setRecentGames] = useState<GameWithResults[]>([]);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [thisMonthGames, setThisMonthGames] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    Promise.all([
      supabase
        .from("games")
        .select("*, game_results(*, players(*))")
        .order("played_at", { ascending: false })
        .limit(3),
      supabase.from("games").select("id", { count: "exact", head: true }),
      supabase
        .from("games")
        .select("id", { count: "exact", head: true })
        .gte("played_at", monthStart),
      supabase.from("players").select("id", { count: "exact", head: true }),
    ]).then(([{ data: gamesData }, { count: total }, { count: thisMonth }, { count: pCount }]) => {
      setRecentGames((gamesData as GameWithResults[]) ?? []);
      setTotalGames(total ?? 0);
      setThisMonthGames(thisMonth ?? 0);
      setPlayerCount(pCount ?? 0);
      setIsLoading(false);
    });
  }, []);

  const lastGame = recentGames[0];
  const lastGameLabel = lastGame
    ? `최근 대국: ${new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date(lastGame.played_at))} ${getModeLabel(lastGame.mode, settings)}`
    : "아직 기록된 대국이 없습니다";

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack spacing={2.25}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
                마작 기록
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {todayLabel}
              </Typography>
            </Box>
            <Chip color="primary" label="4인 마작" size="small" />
          </Stack>

          {/* CTA */}
          <Box
            sx={{
              bgcolor: "primary.main",
              borderRadius: 2,
              color: "primary.contrastText",
              p: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, opacity: 0.86 }}>
                {lastGameLabel}
              </Typography>
              <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>
                새 대국을 시작할 준비가 됐습니다
              </Typography>
              <Button
                color="secondary"
                component={Link}
                fullWidth
                href="/games/new"
                size="large"
                startIcon={<AddIcon />}
                variant="contained"
              >
                대국 시작
              </Button>
            </Stack>
          </Box>

          {/* 요약 통계 */}
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack direction="row" spacing={1}>
              {[
                { label: "총 대국", value: `${totalGames}국`, note: `이번 달 ${thisMonthGames}국`, icon: BarChartIcon },
                { label: "플레이어", value: `${playerCount}명`, note: "등록된 멤버", icon: GroupsIcon },
                { label: "이번 달", value: `${thisMonthGames}국`, note: "이번 달 대국 수", icon: EmojiEventsIcon },
              ].map(({ label, value, note, icon: Icon }) => (
                <Card key={label} variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
                  <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                    <Stack spacing={0.75}>
                      <Icon color="primary" fontSize="small" />
                      <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 800 }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{value}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.25 }}>
                        {note}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* 최근 대국 */}
          <Stack spacing={1.25}>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Typography sx={{ flexGrow: 1, fontSize: 18, fontWeight: 900 }}>
                최근 대국
              </Typography>
              <Button component={Link} href="/history" size="small">
                전체
              </Button>
            </Stack>

            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : recentGames.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: 13, py: 1 }}>
                아직 기록된 대국이 없습니다.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {recentGames.map((game) => {
                  const sorted = [...game.game_results].sort((a, b) => a.rank - b.rank);
                  const winner = sorted[0];
                  const winnerScore = winner
                    ? calculateScore(winner.raw_score, winner.rank, game.mode, settings).appliedScore
                    : 0;
                  return (
                    <Card key={game.id} variant="outlined">
                      <CardActionArea component={Link} href={`/games/${game.id}`}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Stack spacing={0.75}>
                            <Stack direction="row" sx={{ alignItems: "center" }}>
                              <Typography sx={{ flexGrow: 1, fontWeight: 900 }}>
                                1위 {winner?.players?.name ?? "-"}{" "}
                                <Typography component="span" color="text.secondary" sx={{ fontSize: 13 }}>
                                  {winner ? `${formatPoint(winnerScore, true)}pt` : "-"}
                                </Typography>
                              </Typography>
                              <Chip
                                label={new Intl.DateTimeFormat("ko-KR", {
                                  month: "numeric",
                                  day: "numeric",
                                }).format(new Date(game.played_at))}
                                size="small"
                              />
                            </Stack>
                            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                              {getModeLabel(game.mode, settings)}
                            </Typography>
                            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                              {sorted.map((r) => r.players?.name).join(" · ")}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>

      <BottomNav />
    </Box>
  );
}
