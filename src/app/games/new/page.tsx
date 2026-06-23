"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
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
import { useCallback, useEffect, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import { calculateScore, formatPoint, getModeLabel, TOTAL_RAW_SCORE } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { GameMode, Player, Seat } from "@/types";

const STEPS = ["게임 설정", "플레이어 설정", "결과 입력"];

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

// 방위 배치 카드 컴포넌트
function SeatBox({
  seat,
  seats,
  players,
  onAssign,
  dealerId,
}: {
  seat: Seat;
  seats: Record<string, Seat>;
  players: Player[];
  onAssign: (seat: Seat, playerId: string) => void;
  dealerId: string;
}) {
  const assignedPlayerId = Object.entries(seats).find(([, s]) => s === seat)?.[0] ?? "";
  const assignedPlayer = players.find((p) => p.id === assignedPlayerId);
  const isDealer = assignedPlayerId !== "" && assignedPlayerId === dealerId;

  // 다른 자리에 이미 배정된 플레이어
  const takenByOtherSeat = new Set(
    Object.entries(seats)
      .filter(([, s]) => s !== seat)
      .map(([pid]) => pid),
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        textAlign: "center",
        minWidth: 82,
        maxWidth: 100,
        borderColor: isDealer ? "#b5892a" : "divider",
        borderWidth: isDealer ? 2 : 1,
        bgcolor: isDealer ? "#fffbee" : "background.paper",
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 900,
          color: "text.secondary",
          letterSpacing: 1,
          mb: 0.5,
        }}
      >
        {seat}
      </Typography>

      {assignedPlayer ? (
        <Box sx={{ mb: 0.75 }}>
          <Avatar
            sx={{
              bgcolor: isDealer ? "#b5892a" : "primary.main",
              mx: "auto",
              width: 30,
              height: 30,
              fontSize: 13,
              mb: 0.25,
            }}
          >
            {assignedPlayer.name[0]}
          </Avatar>
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
            {assignedPlayer.name}
          </Typography>
          {isDealer && (
            <Typography sx={{ fontSize: 9, color: "#b5892a", fontWeight: 800 }}>
              오야
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 0.75, height: 54, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography color="text.disabled" sx={{ fontSize: 11 }}>
            미배정
          </Typography>
        </Box>
      )}

      <Select
        displayEmpty
        size="small"
        value={assignedPlayerId}
        onChange={(e) => onAssign(seat, e.target.value)}
        sx={{
          fontSize: 11,
          width: "100%",
          "& .MuiSelect-select": { py: 0.5, px: 1 },
        }}
      >
        <MenuItem value="">
          <Typography sx={{ fontSize: 11, color: "text.disabled" }}>선택</Typography>
        </MenuItem>
        {players.map((p) => (
          <MenuItem key={p.id} value={p.id} disabled={takenByOtherSeat.has(p.id)}>
            <Typography sx={{ fontSize: 12 }}>{p.name}</Typography>
          </MenuItem>
        ))}
      </Select>
    </Paper>
  );
}

export default function NewGamePage() {
  const router = useRouter();
  const { settings } = useScoreSettings();

  const [activeStep, setActiveStep] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Step 1
  const [gameType, setGameType] = useState<"online" | "offline">("online");
  const [playedAt, setPlayedAt] = useState(
    () => new Date().toLocaleDateString("sv-SE"),
  );
  const [registrantId, setRegistrantId] = useState("");

  // Step 2
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dealerId, setDealerId] = useState("");
  const [seats, setSeats] = useState<Record<string, Seat>>({});

  // Step 3
  const [scores, setScores] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [scoreErrorOpen, setScoreErrorOpen] = useState(false);

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

  const mode: GameMode =
    gameType === "offline"
      ? "offline_1x"
      : "online_1x";

  const selectedPlayers = players.filter((p) => selectedIds.includes(p.id));

  const handlePlayerToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        if (dealerId === id) setDealerId(next[0] ?? "");
        setSeats((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
        return next;
      }
      if (prev.length >= 4) return prev;
      const next = [...prev, id];
      if (!dealerId) setDealerId(id);
      return next;
    });
  };

  // 나침반 자리 배정: 기존 배정자 제거 후 새 플레이어 배정
  const assignSeat = (seat: Seat, playerId: string) => {
    setSeats((prev) => {
      const next = { ...prev };
      // 해당 자리 기존 배정 제거
      for (const [pid, s] of Object.entries(next)) {
        if (s === seat) delete next[pid];
      }
      // 해당 플레이어의 기존 자리 제거 후 재배정
      if (playerId && next[playerId]) delete next[playerId];
      if (playerId) next[playerId] = seat;
      return next;
    });
  };

  const isStep1Valid = playedAt !== "" && registrantId !== "";

  const isStep2Valid =
    selectedIds.length === 4 &&
    dealerId !== "" &&
    Object.keys(seats).length === 4 &&
    new Set(Object.values(seats)).size === 4;

  const computedRanks = useCallback((): Record<string, number> => {
    const entries = selectedPlayers
      .map((p) => ({ id: p.id, score: parseInt(scores[p.id] ?? "", 10) }))
      .filter((e) => !isNaN(e.score))
      .sort((a, b) => b.score - a.score);

    const ranks: Record<string, number> = {};
    entries.forEach((e, i) => {
      ranks[e.id] = i + 1;
    });
    return ranks;
  }, [selectedPlayers, scores]);

  const isStep3Valid =
    selectedPlayers.every((p) => scores[p.id] !== undefined && scores[p.id] !== "") &&
    Object.keys(computedRanks()).length === 4;

  const scoreRows = isStep3Valid
    ? selectedPlayers
        .map((p) => ({
          player: p,
          ...calculateScore(parseInt(scores[p.id], 10), computedRanks()[p.id], mode, settings),
        }))
        .sort((a, b) => a.rank - b.rank)
    : [];

  const handleSave = async () => {
    if (!isStep3Valid) return;

    const totalScore = selectedPlayers.reduce(
      (sum, p) => sum + parseInt(scores[p.id] ?? "0", 10),
      0,
    );

    if (totalScore !== TOTAL_RAW_SCORE) {
      setScoreErrorOpen(true);
      return;
    }

    setIsSaving(true);

    const ranks = computedRanks();
    const gameCode = await getNextGameCode(playedAt);

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
        seat: seats[p.id],
        is_dealer: p.id === dealerId,
        raw_score: parseInt(scores[p.id], 10),
        rank: ranks[p.id],
      })),
    );

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
                onChange={(_, v) => v && setGameType(v)}
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
                <Select
                  displayEmpty
                  fullWidth
                  size="small"
                  value={registrantId}
                  onChange={(e) => setRegistrantId(e.target.value)}
                >
                  <MenuItem disabled value="">
                    등록자 선택
                  </MenuItem>
                  {players.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </Stack>

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
                <Typography color="text.secondary">
                  플레이어가 4명 이상 필요합니다.
                </Typography>
                <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push("/players")}>
                  플레이어 관리로 이동
                </Button>
              </Box>
            ) : (
              <>
                {/* 플레이어 카드 선택 */}
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

                {selectedIds.length === 4 && (
                  <>
                    {/* 오야 선택 */}
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 700 }}>오야 (기준 플레이어)</Typography>
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
                              <Typography sx={{ fontSize: 13, fontWeight: isDealer ? 800 : 400, color: isDealer ? "#7d5a00" : "text.primary" }}>
                                {p.name}
                              </Typography>
                              {isDealer && (
                                <Typography sx={{ fontSize: 10, color: "#b5892a", fontWeight: 900 }}>
                                  오야
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Stack>

                    {/* 방위 배치 - 나침반 레이아웃 */}
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 700 }}>방위 배치</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, my: 0.5 }}>
                        {/* 북 */}
                        <SeatBox
                          seat="북"
                          seats={seats}
                          players={selectedPlayers}
                          onAssign={assignSeat}
                          dealerId={dealerId}
                        />
                        {/* 서 - 테이블 - 동 */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <SeatBox
                            seat="서"
                            seats={seats}
                            players={selectedPlayers}
                            onAssign={assignSeat}
                            dealerId={dealerId}
                          />
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: "#1a5e3a",
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.15)",
                            }}
                          >
                            <Typography sx={{ fontSize: 28 }}>🀄</Typography>
                          </Box>
                          <SeatBox
                            seat="동"
                            seats={seats}
                            players={selectedPlayers}
                            onAssign={assignSeat}
                            dealerId={dealerId}
                          />
                        </Box>
                        {/* 남 */}
                        <SeatBox
                          seat="남"
                          seats={seats}
                          players={selectedPlayers}
                          onAssign={assignSeat}
                          dealerId={dealerId}
                        />
                      </Box>
                      {Object.keys(seats).length < 4 && (
                        <Typography color="text.secondary" sx={{ fontSize: 12, textAlign: "center" }}>
                          각 방위에 플레이어를 배정하세요
                        </Typography>
                      )}
                    </Stack>
                  </>
                )}
              </>
            )}
          </Stack>
        )}

        {/* Step 3: 결과 입력 */}
        {activeStep === 2 && (
          <Stack spacing={2.5}>
            <Typography sx={{ fontWeight: 700 }}>최종 점수 입력</Typography>
            {(() => {
              const ranks = computedRanks();
              const RANK_COLORS = ["#b5892a", "#8c9aa3", "#8b6553", "#9e9e9e"];
              return (
                <Stack spacing={1.5}>
                  {selectedPlayers.map((p) => {
                    const rank = ranks[p.id];
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
                                (오야)
                              </Typography>
                            )}
                          </Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                            {seats[p.id]}
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
                          onChange={(e) =>
                            setScores((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                        />
                        {rank && (
                          <Box
                            sx={{
                              minWidth: 36,
                              textAlign: "center",
                              bgcolor: rank <= 3 ? `${RANK_COLORS[rank - 1]}22` : "action.hover",
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
              );
            })()}

            {isStep3Valid && (
              <Stack spacing={1}>
                <Paper elevation={0} sx={{ bgcolor: "background.paper", border: 1, borderColor: "primary.main", p: 1.5 }}>
                  <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon color="primary" fontSize="small" />
                    <Typography color="primary" sx={{ fontSize: 13, fontWeight: 700 }}>
                      합계 {TOTAL_RAW_SCORE.toLocaleString()}점 기준 · 대국코드는 저장 시 자동 생성됩니다.
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
              </Stack>
            )}
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
                (activeStep === 0 && !isStep1Valid) ||
                (activeStep === 1 && !isStep2Valid)
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
              저장
            </Button>
          )}
        </Stack>
      </Box>

      <BottomNav />

      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={3000}
        open={scoreErrorOpen}
        sx={{ bottom: { xs: 88, sm: 24 } }}
        onClose={() => setScoreErrorOpen(false)}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setScoreErrorOpen(false)}
        >
          최종 점수의 합계는 100,000점이어야 합니다.
        </Alert>
      </Snackbar>
    </Box>
  );
}
