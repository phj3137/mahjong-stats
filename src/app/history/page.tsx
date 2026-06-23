"use client";

import HistoryIcon from "@mui/icons-material/History";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameWithResults, Player } from "@/types";

const RANK_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(iso));
}

export default function HistoryPage() {
  const router = useRouter();
  const { settings } = useScoreSettings();
  const [games, setGames] = useState<GameWithResults[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterPlayerId, setFilterPlayerId] = useState("all");

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

  const filtered =
    filterPlayerId === "all"
      ? games
      : games.filter((g) =>
          g.game_results.some((r) => r.player_id === filterPlayerId),
        );

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
              {filterPlayerId === "all" ? "아직 기록된 대국이 없습니다." : "해당 플레이어의 대국이 없습니다."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {filtered.map((game) => {
              const sorted = [...game.game_results].sort((a, b) => a.rank - b.rank);
              const winner = sorted[0];
              const winnerName = winner?.players?.name ?? "-";
              const winnerScore = winner
                ? calculateScore(winner.raw_score, winner.rank, game.mode, settings).appliedScore
                : 0;

              return (
                <Card key={game.id} variant="outlined">
                  <CardActionArea onClick={() => router.push(`/games/${game.id}`)}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack spacing={0.75}>
                        <Stack direction="row" sx={{ alignItems: "center" }}>
                          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flexGrow: 1 }}>
                            <Box
                              sx={{
                                bgcolor: "#fff8e1",
                                border: "1.5px solid #b5892a",
                                borderRadius: 0.75,
                                px: 0.75,
                                py: 0.1,
                              }}
                            >
                              <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#b5892a" }}>
                                1위
                              </Typography>
                            </Box>
                            <Typography sx={{ fontWeight: 900 }}>
                              {winnerName}{" "}
                              <Typography component="span" color="text.secondary" sx={{ fontSize: 13 }}>
                                {winner ? `${formatPoint(winnerScore, true)}pt` : "-"}
                              </Typography>
                            </Typography>
                          </Stack>
                          <Chip label={formatDate(game.played_at)} size="small" />
                        </Stack>
                        <Chip
                          label={getModeLabel(game.mode, settings)}
                          size="small"
                          sx={{ alignSelf: "flex-start" }}
                          variant="outlined"
                        />
                        <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 800 }}>
                          {game.game_code}
                        </Typography>
                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.25 }}>
                          {sorted.map((r, i) => (
                            <Typography
                              key={r.player_id}
                              component="span"
                              sx={{ fontSize: 12, color: RANK_COLORS[r.rank - 1] ?? "text.secondary" }}
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
      </Box>

      <BottomNav />
    </Box>
  );
}
