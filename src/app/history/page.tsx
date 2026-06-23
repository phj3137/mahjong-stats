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
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameWithResults, Player } from "@/types";

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

        {/* 플레이어 필터 */}
        {players.length > 0 && (
          <Select
            displayEmpty
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={filterPlayerId}
            onChange={(e) => setFilterPlayerId(e.target.value)}
          >
            <MenuItem value="all">전체 플레이어</MenuItem>
            {players.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
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
                          <Typography sx={{ flexGrow: 1, fontWeight: 900 }}>
                            1위 {winnerName}{" "}
                            <Typography component="span" color="text.secondary" sx={{ fontSize: 13 }}>
                              {winner ? `${formatPoint(winnerScore, true)}pt` : "-"}
                            </Typography>
                          </Typography>
                          <Chip label={formatDate(game.played_at)} size="small" />
                        </Stack>
                        <Chip
                          label={getModeLabel(game.mode, settings)}
                          size="small"
                          sx={{ alignSelf: "flex-start" }}
                          variant="outlined"
                        />
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
      </Box>

      <BottomNav />
    </Box>
  );
}
