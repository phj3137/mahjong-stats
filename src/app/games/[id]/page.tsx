"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameWithResults } from "@/types";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32", "#9e9e9e"];

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { settings } = useScoreSettings();

  const [game, setGame] = useState<GameWithResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from("games")
      .select("*, game_results(*, players(*)), registrant:players!registered_by(id,name,created_at)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setGame(data as GameWithResults);
        setIsLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    await supabase.from("games").delete().eq("id", id);
    setIsDeleting(false);
    router.push("/history");
  };

  const sorted = game
    ? [...game.game_results].sort((a, b) => a.rank - b.rank)
    : [];

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
            대국 상세
          </Typography>
          <IconButton
            aria-label="삭제"
            color="error"
            onClick={() => setDeleteOpen(true)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : !game ? (
          <Typography color="text.secondary" sx={{ pt: 4, textAlign: "center" }}>
            대국을 찾을 수 없습니다.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                  <Chip label={getModeLabel(game.mode, settings)} color="primary" />
                </Stack>
                <Stack spacing={0.5}>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Typography color="text.secondary" sx={{ fontSize: 12, minWidth: 56 }}>
                      대국코드
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                      {game.game_code}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Typography color="text.secondary" sx={{ fontSize: 12, minWidth: 56 }}>
                      대국 날짜
                    </Typography>
                    <Typography sx={{ fontSize: 12 }}>
                      {new Intl.DateTimeFormat("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      }).format(new Date(game.played_at))}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Typography color="text.secondary" sx={{ fontSize: 12, minWidth: 56 }}>
                      등록 시간
                    </Typography>
                    <Typography sx={{ fontSize: 12 }}>
                      {new Intl.DateTimeFormat("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(game.created_at))}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Typography color="text.secondary" sx={{ fontSize: 12, minWidth: 56 }}>
                      등록자
                    </Typography>
                    <Typography sx={{ fontSize: 12 }}>
                      {game.registrant?.name ?? "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>

            <Divider />

            <Stack spacing={1.5}>
              {sorted.map((result) => {
                const score = calculateScore(result.raw_score, result.rank, game.mode, settings);

                return (
                  <Stack
                    key={result.id}
                    direction="row"
                    sx={{ alignItems: "center", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: RANK_COLORS[result.rank - 1] + "22",
                        borderRadius: 1,
                        display: "flex",
                        flexShrink: 0,
                        height: 40,
                        justifyContent: "center",
                        width: 40,
                      }}
                    >
                      {result.rank === 1 ? (
                        <EmojiEventsIcon sx={{ color: RANK_COLORS[0], fontSize: 22 }} />
                      ) : (
                        <Typography
                          sx={{
                            color: RANK_COLORS[result.rank - 1],
                            fontSize: 18,
                            fontWeight: 900,
                          }}
                        >
                          {result.rank}
                        </Typography>
                      )}
                    </Box>

                    <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 14 }}>
                      {result.players?.name[0]}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {result.players?.name}
                        </Typography>
                        {result.is_dealer && (
                          <Chip label="오야" size="small" color="primary" variant="outlined" />
                        )}
                      </Stack>
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {result.seat} · {result.raw_score.toLocaleString()}점
                      </Typography>
                    </Box>

                    <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                      {formatPoint(score.appliedScore, true)}
                      <Typography component="span" color="text.secondary" sx={{ fontSize: 12, ml: 0.25 }}>
                        pt
                      </Typography>
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>

            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small" sx={{ minWidth: 620 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>이름</TableCell>
                    <TableCell align="right">점수</TableCell>
                    <TableCell align="right">순위</TableCell>
                    <TableCell align="right">우마</TableCell>
                    <TableCell align="right">오카</TableCell>
                    <TableCell align="right">최종점수</TableCell>
                    <TableCell align="right">반영점수</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.map((result) => {
                    const score = calculateScore(result.raw_score, result.rank, game.mode, settings);

                    return (
                      <TableRow key={result.id}>
                        <TableCell>{result.players?.name}</TableCell>
                        <TableCell align="right">{result.raw_score.toLocaleString()}</TableCell>
                        <TableCell align="right">{result.rank}</TableCell>
                        <TableCell align="right">{formatPoint(score.uma, true)}</TableCell>
                        <TableCell align="right">{formatPoint(score.oka, true)}</TableCell>
                        <TableCell align="right">{formatPoint(score.finalScore, true)}</TableCell>
                        <TableCell align="right">{formatPoint(score.appliedScore, true)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </Box>

      <BottomNav />

      <Dialog open={deleteOpen} onClose={() => !isDeleting && setDeleteOpen(false)}>
        <DialogTitle>대국 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 대국 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setDeleteOpen(false)}>
            취소
          </Button>
          <Button
            color="error"
            disabled={isDeleting}
            loading={isDeleting}
            variant="contained"
            onClick={handleDelete}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
