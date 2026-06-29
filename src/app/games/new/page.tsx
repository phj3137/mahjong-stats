"use client";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel, TOTAL_RAW_SCORE } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameMode, Player } from "@/types";

const STEPS = ["게임 설정", "플레이어 설정", "결과 입력"];
const RANK_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];

function formatGameCodeDate(date: string) {
  return date.replaceAll("-", "");
}

async function getNextGameCode(playedAt: string) {
  const prefix = formatGameCodeDate(playedAt);
  const from = new Date(`${playedAt}T00:00:00`).toISOString();
  const to = new Date(`${playedAt}T00:00:00`);
  to.setDate(to.getDate() + 1);

  const { data } = await supabase
    .from("games")
    .select("game_code")
    .gte("played_at", from)
    .lt("played_at", to.toISOString())
    .like("game_code", `${prefix}-%`)
    .order("game_code", { ascending: false })
    .limit(1);

  const lastCode = data?.[0]?.game_code;
  const lastNumber = lastCode ? Number(lastCode.split("-")[1]) : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

  return `${prefix}-${String(nextNumber).padStart(2, "0")}`;
}

function computeBaseRanks(
  scores: Record<string, string>,
  players: Player[],
): Record<string, number> {
  const entries = players
    .map((p) => ({ id: p.id, score: parseInt(scores[p.id] ?? "", 10) }))
    .filter((e) => !isNaN(e.score))
    .sort((a, b) => b.score - a.score);
  const ranks: Record<string, number> = {};
  entries.forEach((e, i) => {
    ranks[e.id] = i + 1;
  });
  return ranks;
}

type TiedGroup = {
  score: number;
  players: Array<{ player: Player; rank: number }>;
};

function detectTiedGroups(
  scores: Record<string, string>,
  players: Player[],
  finalRanks: Record<string, number>,
): TiedGroup[] {
  const scoreMap = new Map<number, Player[]>();
  for (const p of players) {
    const s = parseInt(scores[p.id] ?? "", 10);
    if (!isNaN(s)) {
      if (!scoreMap.has(s)) scoreMap.set(s, []);
      scoreMap.get(s)!.push(p);
    }
  }
  return Array.from(scoreMap.entries())
    .filter(([, ps]) => ps.length > 1)
    .map(([score, ps]) => ({
      score,
      players: ps
        .map((p) => ({ player: p, rank: finalRanks[p.id] ?? 0 }))
        .sort((a, b) => a.rank - b.rank),
    }));
}

function RoundCard({
  roundIndex,
  totalRounds,
  scores,
  selectedPlayers,
  dealerId,
  mode,
  onScoreChange,
  onRemove,
  tieOrder,
  tieClickSeq,
  onClickTied,
}: {
  roundIndex: number;
  totalRounds: number;
  scores: Record<string, string>;
  selectedPlayers: Player[];
  dealerId: string;
  mode: GameMode;
  onScoreChange: (playerId: string, value: string) => void;
  onRemove: () => void;
  tieOrder: Record<string, number>;
  tieClickSeq: Record<string, string[]>;
  onClickTied: (playerId: string, score: number) => void;
}) {
  const { settings } = useScoreSettings();

  const baseRanks = computeBaseRanks(scores, selectedPlayers);
  const finalRanks: Record<string, number> = { ...baseRanks, ...tieOrder };

  const isValid =
    selectedPlayers.every((p) => scores[p.id] !== undefined && scores[p.id] !== "") &&
    Object.keys(finalRanks).length === 4;

  const totalScore = selectedPlayers.reduce(
    (sum, p) => sum + (parseInt(scores[p.id] ?? "0", 10) || 0),
    0,
  );

  const tiedGroups = isValid ? detectTiedGroups(scores, selectedPlayers, finalRanks) : [];

  const scoreRows =
    isValid && totalScore === TOTAL_RAW_SCORE
      ? selectedPlayers
          .map((p) => ({
            player: p,
            ...calculateScore(parseInt(scores[p.id], 10), finalRanks[p.id], mode, settings),
          }))
          .sort((a, b) => a.rank - b.rank)
      : [];

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", mb: 1.5 }}>
        <Typography sx={{ fontWeight: 700, flex: 1 }}>대국 {roundIndex + 1}</Typography>
        {totalRounds > 1 && (
          <Button
            color="error"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            variant="text"
            onClick={onRemove}
          >
            삭제
          </Button>
        )}
      </Stack>

      <Stack spacing={1.5}>
        {selectedPlayers.map((p) => {
          const rank = finalRanks[p.id];
          return (
            <Stack key={p.id} direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "primary.main", flexShrink: 0, width: 32, height: 32, fontSize: 14 }}>
                {p.name[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  {p.name}
                  {p.id === dealerId && (
                    <Typography component="span" sx={{ fontSize: 11, ml: 0.5, color: "#b5892a", fontWeight: 800 }}>
                      (기가)
                    </Typography>
                  )}
                </Typography>
              </Box>
              <TextField
                size="small"
                sx={{ width: 120 }}
                type="number"
                value={scores[p.id] ?? ""}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">점</InputAdornment>,
                  },
                }}
                onChange={(e) => onScoreChange(p.id, e.target.value)}
              />
              {rank && (
                <Box
                  sx={{
                    minWidth: 36,
                    textAlign: "center",
                    bgcolor: `${RANK_COLORS[rank - 1] ?? "#9e9e9e"}22`,
                    border: `1.5px solid ${RANK_COLORS[rank - 1] ?? "#9e9e9e"}`,
                    borderRadius: 1,
                    py: 0.25,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: RANK_COLORS[rank - 1] ?? "text.secondary",
                    }}
                  >
                    {rank}위
                  </Typography>
                </Box>
              )}
            </Stack>
          );
        })}
      </Stack>

      {isValid && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {totalScore !== TOTAL_RAW_SCORE && (
            <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
              합계 {totalScore.toLocaleString()}점 (기준: {TOTAL_RAW_SCORE.toLocaleString()}점)
            </Alert>
          )}

          {totalScore === TOTAL_RAW_SCORE && (
            <>
              {tiedGroups.length > 0 && (
                <Stack spacing={1}>
                  {tiedGroups.map((group) => {
                    const scoreKey = String(group.score);
                    const clickSeq = tieClickSeq[scoreKey] ?? [];
                    const isComplete = clickSeq.length === group.players.length;

                    return (
                      <Alert
                        key={group.score}
                        severity={isComplete ? "success" : "warning"}
                        variant="outlined"
                        sx={{ py: 0.75 }}
                      >
                        <Stack direction="row" sx={{ alignItems: "center", mb: 0.75 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 800, flex: 1 }}>
                            {group.score.toLocaleString()}점 동점
                            {isComplete ? " — 순위 확정" : " — 높은 순위부터 클릭하세요"}
                          </Typography>
                          {clickSeq.length > 0 && (
                            <Button
                              size="small"
                              color="inherit"
                              sx={{ fontSize: 10, py: 0, px: 0.75, minWidth: 0, opacity: 0.7 }}
                              onClick={() => onClickTied(clickSeq[0], group.score)}
                            >
                              초기화
                            </Button>
                          )}
                        </Stack>
                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                          {group.players.map((entry) => {
                            const clickIdx = clickSeq.indexOf(entry.player.id);
                            const isClicked = clickIdx !== -1;
                            const rankColor = RANK_COLORS[entry.rank - 1] ?? "#9e9e9e";

                            return (
                              <Box
                                key={entry.player.id}
                                onClick={() => onClickTied(entry.player.id, group.score)}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  px: 1.25,
                                  py: 0.5,
                                  border: "1.5px solid",
                                  borderColor: isComplete
                                    ? rankColor
                                    : isClicked
                                      ? "primary.main"
                                      : "divider",
                                  borderRadius: 1.5,
                                  bgcolor: isComplete
                                    ? `${rankColor}22`
                                    : isClicked
                                      ? "action.selected"
                                      : "background.paper",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  "&:hover": {
                                    borderColor: isComplete ? rankColor : "primary.light",
                                  },
                                }}
                              >
                                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                                  {entry.player.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    fontWeight: 900,
                                    color: isComplete
                                      ? rankColor
                                      : isClicked
                                        ? "primary.main"
                                        : "text.disabled",
                                  }}
                                >
                                  {isComplete
                                    ? `${entry.rank}위`
                                    : isClicked
                                      ? `${clickIdx + 1}번째`
                                      : "?"}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Alert>
                    );
                  })}
                </Stack>
              )}

              <Paper
                elevation={0}
                sx={{ bgcolor: "background.paper", border: 1, borderColor: "primary.main", p: 1.25 }}
              >
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon color="primary" fontSize="small" />
                  <Typography color="primary" sx={{ fontSize: 12, fontWeight: 700 }}>
                    합계 {TOTAL_RAW_SCORE.toLocaleString()}점 확인
                  </Typography>
                </Stack>
              </Paper>

              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#2d6a4f" }}>
                      {["이름", "점수", "순위", "우마", "오카", "최종", "반영"].map((h) => (
                        <TableCell
                          key={h}
                          align={h === "이름" ? "left" : "right"}
                          sx={{ color: "#fff", fontWeight: 700, py: 0.75 }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scoreRows.map((row) => (
                      <TableRow
                        key={row.player.id}
                        sx={{ bgcolor: row.rank === 1 ? "#fff8e1" : "inherit" }}
                      >
                        <TableCell sx={{ fontWeight: row.rank === 1 ? 800 : 400 }}>
                          {row.player.name}
                        </TableCell>
                        <TableCell align="right">{row.rawScore.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.rank}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.uma >= 0 ? "#2d6a4f" : "#c0392b", fontWeight: 700 }}
                        >
                          {formatPoint(row.uma, true)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.oka >= 0 ? "#2d6a4f" : "#c0392b", fontWeight: 700 }}
                        >
                          {formatPoint(row.oka, true)}
                        </TableCell>
                        <TableCell align="right">{formatPoint(row.finalScore, true)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {formatPoint(row.appliedScore, true)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
}

export default function NewGamePage() {
  const router = useRouter();
  const { settings } = useScoreSettings();

  const [activeStep, setActiveStep] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Step 1
  const [gameType, setGameType] = useState<"online" | "offline" | null>(null);
  const [playedAt, setPlayedAt] = useState(() => new Date().toLocaleDateString("sv-SE"));
  const [registrantId, setRegistrantId] = useState("");

  // Step 2
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dealerId, setDealerId] = useState("");

  // Step 3
  const [rounds, setRounds] = useState<Array<Record<string, string>>>([{}]);
  const [tieOrders, setTieOrders] = useState<Array<Record<string, number>>>([{}]);
  // 동점자 클릭 순서: [roundIndex][scoreKey] = [playerId, ...]
  const [tieClickSeqs, setTieClickSeqs] = useState<Array<Record<string, string[]>>>([{}]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("players")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setPlayers(data ?? []);
        setIsLoadingPlayers(false);
      });
  }, []);

  const mode: GameMode = gameType === "offline" ? "offline_1x" : "online_1x";
  const selectedPlayers = players.filter((p) => selectedIds.includes(p.id));

  const handlePlayerToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        if (dealerId === id) setDealerId(next[0] ?? "");
        return next;
      }
      if (prev.length >= 4) return prev;
      const next = [...prev, id];
      if (!dealerId) setDealerId(id);
      return next;
    });
  };

  const isStep1Valid = playedAt !== "" && registrantId !== "" && gameType !== null;
  const isStep2Valid = selectedIds.length === 4 && dealerId !== "";

  const isRoundValid = useCallback(
    (roundScores: Record<string, string>) => {
      const values = selectedPlayers.map((p) => parseInt(roundScores[p.id] ?? "", 10));
      if (values.some(isNaN)) return false;
      return values.reduce((a, b) => a + b, 0) === TOTAL_RAW_SCORE;
    },
    [selectedPlayers],
  );

  const isStep3Valid = rounds.length > 0 && rounds.every(isRoundValid);

  const updateRoundScore = (roundIndex: number, playerId: string, value: string) => {
    setRounds((prev) => {
      const next = [...prev];
      next[roundIndex] = { ...next[roundIndex], [playerId]: value };
      return next;
    });
    setTieOrders((prev) => {
      const next = [...prev];
      next[roundIndex] = {};
      return next;
    });
    setTieClickSeqs((prev) => {
      const next = [...prev];
      next[roundIndex] = {};
      return next;
    });
  };

  const addRound = () => {
    setRounds((prev) => [...prev, {}]);
    setTieOrders((prev) => [...prev, {}]);
    setTieClickSeqs((prev) => [...prev, {}]);
  };

  const removeRound = (index: number) => {
    setRounds((prev) => prev.filter((_, i) => i !== index));
    setTieOrders((prev) => prev.filter((_, i) => i !== index));
    setTieClickSeqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTieClick = (roundIndex: number, playerId: string, score: number) => {
    const roundScores = rounds[roundIndex];
    const baseRanks = computeBaseRanks(roundScores, selectedPlayers);
    const groupPlayers = selectedPlayers.filter(
      (p) => parseInt(roundScores[p.id] ?? "", 10) === score,
    );
    const minRank = Math.min(...groupPlayers.map((p) => baseRanks[p.id]));
    const scoreKey = String(score);
    const currentSeq = tieClickSeqs[roundIndex]?.[scoreKey] ?? [];
    const isComplete = currentSeq.length === groupPlayers.length;

    // 이미 클릭한 플레이어 재클릭 또는 완성된 그룹 클릭 → 초기화
    let newSeq: string[];
    if (isComplete || currentSeq.includes(playerId)) {
      newSeq = [];
    } else {
      newSeq = [...currentSeq, playerId];
    }

    setTieClickSeqs((prev) => {
      const next = [...prev];
      next[roundIndex] = { ...next[roundIndex], [scoreKey]: newSeq };
      return next;
    });

    if (newSeq.length === groupPlayers.length && newSeq.length > 0) {
      // 클릭 순서대로 순위 할당
      setTieOrders((prev) => {
        const next = [...prev];
        const roundOrders = { ...next[roundIndex] };
        newSeq.forEach((pid, i) => {
          roundOrders[pid] = minRank + i;
        });
        next[roundIndex] = roundOrders;
        return next;
      });
    } else {
      // 초기화 또는 부분 선택 — 이 그룹 순위 초기화
      setTieOrders((prev) => {
        const next = [...prev];
        const roundOrders = { ...next[roundIndex] };
        groupPlayers.forEach((p) => delete roundOrders[p.id]);
        next[roundIndex] = roundOrders;
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!isStep3Valid) return;
    setIsSaving(true);

    for (const [roundIndex, roundScores] of rounds.entries()) {
      const gameCode = await getNextGameCode(playedAt);
      const baseRanks = computeBaseRanks(roundScores, selectedPlayers);
      const finalRanks = { ...baseRanks, ...(tieOrders[roundIndex] ?? {}) };

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          game_code: gameCode,
          mode,
          played_at: new Date(playedAt + "T00:00:00").toISOString(),
          registered_by: registrantId || null,
        })
        .select("id")
        .single();

      if (gameError || !gameData) {
        setIsSaving(false);
        return;
      }

      await supabase.from("game_results").insert(
        selectedPlayers.map((p) => ({
          game_id: gameData.id,
          player_id: p.id,
          is_dealer: p.id === dealerId,
          raw_score: parseInt(roundScores[p.id], 10),
          rank: finalRanks[p.id],
        })),
      );
    }

    setIsSaving(false);
    router.push("/history");
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900, mb: 2 }}>
          대국 기록
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: 게임 설정 */}
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>게임 유형</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                color="primary"
                value={gameType}
                onChange={(_, v) => v !== null && setGameType(v)}
              >
                <ToggleButton value="online">온라인</ToggleButton>
                <ToggleButton value="offline">오프라인</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>대국 날짜</Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={playedAt}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(e) => setPlayedAt(e.target.value)}
              />
            </Stack>

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>등록자</Typography>
              {isLoadingPlayers ? (
                <CircularProgress size={20} />
              ) : (
                <Autocomplete
                  options={players}
                  getOptionLabel={(p) => p.name}
                  value={players.find((p) => p.id === registrantId) ?? null}
                  onChange={(_, v) => setRegistrantId(v?.id ?? "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="등록자 검색"
                      placeholder="이름으로 검색"
                      size="small"
                    />
                  )}
                  noOptionsText="선수 없음"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              )}
            </Stack>

            {gameType && (
              <Paper
                elevation={0}
                sx={{
                  background: "linear-gradient(135deg, #1a5e3a 0%, #2d6a4f 100%)",
                  color: "primary.contrastText",
                  p: 2,
                }}
              >
                <Typography sx={{ fontSize: 13, opacity: 0.8 }}>선택된 모드</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                  {getModeLabel(mode, settings)}
                </Typography>
              </Paper>
            )}
          </Stack>
        )}

        {/* Step 2: 플레이어 설정 */}
        {activeStep === 1 && (
          <Stack spacing={2.5}>
            {isLoadingPlayers ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress />
              </Box>
            ) : players.length < 4 ? (
              <Box sx={{ textAlign: "center", pt: 4 }}>
                <Typography color="text.secondary">플레이어가 4명 이상 필요합니다.</Typography>
                <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push("/players")}>
                  플레이어 관리로 이동
                </Button>
              </Box>
            ) : (
              <>
                {/* 참여 플레이어 선택 */}
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>
                    참여 플레이어{" "}
                    <Typography component="span" color="text.secondary" sx={{ fontSize: 13, fontWeight: 400 }}>
                      ({selectedIds.length}/4)
                    </Typography>
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {players.map((player) => {
                      const isSelected = selectedIds.includes(player.id);
                      const isDisabled = !isSelected && selectedIds.length >= 4;
                      return (
                        <Paper
                          key={player.id}
                          variant="outlined"
                          onClick={() => !isDisabled && handlePlayerToggle(player.id)}
                          sx={{
                            p: 1,
                            minWidth: 72,
                            textAlign: "center",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            opacity: isDisabled ? 0.4 : 1,
                            borderColor: isSelected ? "primary.main" : "divider",
                            borderWidth: isSelected ? 2 : 1,
                            bgcolor: isSelected ? "primary.main" : "background.paper",
                            transition: "all 0.15s",
                            userSelect: "none",
                            "&:hover": isDisabled
                              ? {}
                              : {
                                  borderColor: isSelected ? "primary.dark" : "primary.light",
                                  bgcolor: isSelected ? "primary.dark" : "action.hover",
                                },
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: isSelected ? "rgba(255,255,255,0.25)" : "primary.main",
                              mx: "auto",
                              mb: 0.5,
                              width: 36,
                              height: 36,
                              fontSize: 15,
                            }}
                          >
                            {player.name[0]}
                          </Avatar>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isSelected ? "primary.contrastText" : "text.primary",
                            }}
                          >
                            {player.name}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                </Stack>

                {/* 기가 선택 */}
                {selectedIds.length === 4 && (
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 700 }}>기가</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {selectedPlayers.map((p) => {
                        const isDealer = dealerId === p.id;
                        return (
                          <Box
                            key={p.id}
                            onClick={() => setDealerId(p.id)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              px: 1.25,
                              py: 0.75,
                              border: "1.5px solid",
                              borderColor: isDealer ? "#b5892a" : "divider",
                              borderRadius: 1.5,
                              bgcolor: isDealer ? "#fff8e1" : "background.paper",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              "&:hover": { borderColor: "#b5892a", bgcolor: "#fffbee" },
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: isDealer ? "#b5892a" : "primary.main",
                                width: 24,
                                height: 24,
                                fontSize: 11,
                              }}
                            >
                              {p.name[0]}
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: isDealer ? 800 : 400,
                                color: isDealer ? "#7d5a00" : "text.primary",
                              }}
                            >
                              {p.name}
                            </Typography>
                            {isDealer && (
                              <Typography sx={{ fontSize: 10, color: "#b5892a", fontWeight: 900 }}>
                                기가
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        )}

        {/* Step 3: 결과 입력 */}
        {activeStep === 2 && (
          <Stack spacing={2.5}>
            {rounds.map((roundScores, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ mb: 2.5 }} />}
                <RoundCard
                  roundIndex={index}
                  totalRounds={rounds.length}
                  scores={roundScores}
                  selectedPlayers={selectedPlayers}
                  dealerId={dealerId}
                  mode={mode}
                  onScoreChange={(playerId, value) => updateRoundScore(index, playerId, value)}
                  onRemove={() => removeRound(index)}
                  tieOrder={tieOrders[index] ?? {}}
                  tieClickSeq={tieClickSeqs[index] ?? {}}
                  onClickTied={(playerId, score) => handleTieClick(index, playerId, score)}
                />
              </Box>
            ))}

            <Button fullWidth startIcon={<AddIcon />} variant="outlined" onClick={addRound}>
              대국 추가
            </Button>
          </Stack>
        )}

        {/* 하단 버튼 */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          {activeStep > 0 && (
            <Button
              disabled={isSaving}
              fullWidth
              variant="outlined"
              onClick={() => setActiveStep((s) => s - 1)}
            >
              이전
            </Button>
          )}
          {activeStep < STEPS.length - 1 ? (
            <Button
              disabled={
                (activeStep === 0 && !isStep1Valid) || (activeStep === 1 && !isStep2Valid)
              }
              fullWidth
              variant="contained"
              onClick={() => setActiveStep((s) => s + 1)}
            >
              다음
            </Button>
          ) : (
            <Button
              disabled={!isStep3Valid || isSaving}
              fullWidth
              loading={isSaving}
              variant="contained"
              onClick={handleSave}
            >
              {rounds.length > 1 ? `${rounds.length}대국 저장` : "저장"}
            </Button>
          )}
        </Stack>
      </Box>

      <BottomNav />
    </Box>
  );
}
