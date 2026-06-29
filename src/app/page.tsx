"use client";

import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
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

const RANK_BADGE_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];
const RANK_BADGE_BG = ["#fff8e1", "#f5f5f5", "#fbe9e7", "#f5f5f5"];

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
            {/* 마작패 로고 */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                background: "linear-gradient(135deg, #1a5e3a 0%, #2d6a4f 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(45,106,79,0.35)",
              }}
            >
              <Typography sx={{ fontSize: 28, lineHeight: 1, userSelect: "none" }}>
                🀄
              </Typography>
            </Box>

            {/* 타이틀 */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.3px", lineHeight: 1.2 }}
              >
                mahjong stats
              </Typography>
              <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, mt: 0.25 }}>
                <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
                  flagon mindsports
                </Typography>
                <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
                <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
                  {todayLabel}
                </Typography>
              </Stack>
            </Box>

            {/* 액션 버튼 */}
            <IconButton component={Link} href="/rulebook" size="small" aria-label="룰북">
              <MenuBookIcon fontSize="small" />
            </IconButton>
            <IconButton component={Link} href="/settings" size="small" aria-label="설정">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* CTA */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #1a5e3a 0%, #2d6a4f 60%, #3d8b6b 100%)",
              borderRadius: 2,
              color: "primary.contrastText",
              p: 2,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle at 15% 85%, rgba(255,255,255,0.07) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.07) 0%, transparent 45%)",
                pointerEvents: "none",
              },
            }}
          >
            <Stack spacing={1.5} sx={{ position: "relative" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, opacity: 0.82 }}>
                {lastGameLabel}
              </Typography>
              <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>
                새 대국을 시작할 준비가 됐습니다
              </Typography>
              <Button
                component={Link}
                fullWidth
                href="/games/new"
                size="large"
                startIcon={<AddIcon />}
                variant="contained"
                sx={{
                  bgcolor: "#b5892a",
                  color: "#fff",
                  "&:hover": { bgcolor: "#9a7222" },
                }}
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
                              <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flexGrow: 1 }}>
                                <Box
                                  sx={{
                                    bgcolor: RANK_BADGE_BG[0],
                                    border: `1.5px solid ${RANK_BADGE_COLORS[0]}`,
                                    borderRadius: 0.75,
                                    px: 0.75,
                                    py: 0.1,
                                  }}
                                >
                                  <Typography sx={{ fontSize: 10, fontWeight: 900, color: RANK_BADGE_COLORS[0] }}>
                                    1위
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 900 }}>
                                  {winner?.players?.name ?? "-"}{" "}
                                  <Typography component="span" color="text.secondary" sx={{ fontSize: 13 }}>
                                    {winner ? `${formatPoint(winnerScore, true)}pt` : "-"}
                                  </Typography>
                                </Typography>
                              </Stack>
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
                            <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 800 }}>
                              {game.game_code}
                            </Typography>
                            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.25 }}>
                              {sorted.map((r, i) => (
                                <Typography
                                  key={r.player_id}
                                  component="span"
                                  sx={{ fontSize: 12, color: RANK_BADGE_COLORS[r.rank - 1] ?? "text.secondary" }}
                                >
                                  {i > 0 && (
                                    <Typography component="span" color="text.disabled" sx={{ fontSize: 12, mx: 0.25 }}>
                                      ·
                                    </Typography>
                                  )}
                                  {r.players?.name}
                                </Typography>
                              ))}
                            </Stack>
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
