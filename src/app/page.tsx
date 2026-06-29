"use client";

import AddIcon from "@mui/icons-material/Add";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
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

const RANK_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];
const RANK_BG = ["#fff8e1", "#f5f5f5", "#fbe9e7", "#f5f5f5"];

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
    ? `최근 대국 · ${new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date(lastGame.played_at))} ${getModeLabel(lastGame.mode, settings)}`
    : "아직 기록된 대국이 없습니다";

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2.5, pt: 2.5, pb: 10 }}
      >
        <Stack spacing={2.5}>

          {/* ── 헤더 ── */}
          <Box>
            {/* 마스트헤드 */}
            <Stack direction="row" sx={{ alignItems: "center", mb: 1 }}>
              <Typography
                sx={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  color: "text.disabled",
                  flexGrow: 1,
                  userSelect: "none",
                }}
              >
                FLAGON MINDSPORTS GALLERY
              </Typography>
              <IconButton component={Link} href="/rulebook" size="small" aria-label="룰북">
                <MenuBookIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton component={Link} href="/settings" size="small" aria-label="설정">
                <SettingsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

            {/* 골드 룰 */}
            <Box
              sx={{
                height: 1,
                background: "linear-gradient(90deg, #b5892a 0%, #e4c76b 50%, #b5892a 100%)",
                mb: 1.75,
                opacity: 0.65,
              }}
            />

            {/* 메인 타이틀 */}
            <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "space-between" }}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
                <Typography sx={{ fontSize: 32, lineHeight: 1, userSelect: "none" }}>
                  🀄
                </Typography>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: 36,
                    fontWeight: 900,
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    color: "text.primary",
                  }}
                >
                  마작 전적
                </Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ fontSize: 12, pb: 0.25 }}>
                {todayLabel}
              </Typography>
            </Stack>
          </Box>

          {/* ── CTA ── */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #1a5e3a 0%, #2d6a4f 65%, #3a7a5c 100%)",
              borderRadius: 2.5,
              color: "#fff",
              px: 2,
              pt: 1.75,
              pb: 2,
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                pointerEvents: "none",
              },
            }}
          >
            <Typography sx={{ fontSize: 11.5, opacity: 0.6, mb: 1.25, fontWeight: 500 }}>
              {lastGameLabel}
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
                fontWeight: 800,
                fontSize: 15,
                py: 1.25,
                "&:hover": { bgcolor: "#9a7222" },
              }}
            >
              새 대국 시작
            </Button>
          </Box>

          {/* ── 통계 ── */}
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
              <CircularProgress size={22} />
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

          {/* ── 최근 대국 ── */}
          <Stack spacing={1.25}>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Typography sx={{ flexGrow: 1, fontSize: 15, fontWeight: 900, letterSpacing: "-0.3px" }}>
                최근 대국
              </Typography>
              <Button component={Link} href="/history" size="small" sx={{ fontSize: 12 }}>
                전체 보기
              </Button>
            </Stack>

            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={22} />
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
                  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                  }).format(new Date(game.played_at));

                  return (
                    <Card key={game.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardActionArea component={Link} href={`/games/${game.id}`}>
                        <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                          {/* 1위 + 날짜 */}
                          <Stack
                            direction="row"
                            sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}
                          >
                            <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
                              <Box
                                sx={{
                                  bgcolor: RANK_BG[0],
                                  border: `1.5px solid ${RANK_COLORS[0]}`,
                                  borderRadius: 0.75,
                                  px: 0.75,
                                  py: 0.15,
                                }}
                              >
                                <Typography sx={{ fontSize: 10, fontWeight: 900, color: RANK_COLORS[0] }}>
                                  1위
                                </Typography>
                              </Box>
                              <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                                {winner?.players?.name ?? "-"}
                              </Typography>
                              <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                                {winner ? `${formatPoint(winnerScore, true)}pt` : ""}
                              </Typography>
                            </Stack>
                            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                              {dateLabel}
                            </Typography>
                          </Stack>

                          {/* 모드 + 참여자 */}
                          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "primary.main",
                                bgcolor: "rgba(45,106,79,0.08)",
                                px: 0.75,
                                py: 0.2,
                                borderRadius: 0.75,
                                flexShrink: 0,
                              }}
                            >
                              {getModeLabel(game.mode, settings)}
                            </Typography>
                            <Stack direction="row" sx={{ gap: 0.25, flexWrap: "wrap" }}>
                              {sorted.map((r, i) => (
                                <Typography
                                  key={r.player_id}
                                  component="span"
                                  sx={{
                                    fontSize: 12,
                                    color: RANK_COLORS[r.rank - 1] ?? "text.secondary",
                                    fontWeight: r.rank === 1 ? 800 : 400,
                                  }}
                                >
                                  {i > 0 && (
                                    <Typography
                                      component="span"
                                      color="text.disabled"
                                      sx={{ fontSize: 12, mx: 0.25 }}
                                    >
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
