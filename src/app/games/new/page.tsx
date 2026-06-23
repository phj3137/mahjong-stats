"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
const SEATS: Seat[] = ["동", "서", "남", "북"];

export default function NewGamePage() {
  const router = useRouter();
  const { settings } = useScoreSettings();

  const [activeStep, setActiveStep] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Step 1
  const [gameType, setGameType] = useState<"online" | "offline">("online");
  const [playedAt, setPlayedAt] = useState(
    () => new Date().toLocaleDateString("sv-SE"), // YYYY-MM-DD 포맷
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

  const assignedSeats = new Set(Object.values(seats));
  const availableSeats = (forId: string) =>
    SEATS.filter((s) => s === seats[forId] || !assignedSeats.has(s));

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

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert({
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
              sx={{ bgcolor: "primary.main", color: "primary.contrastText", p: 2 }}
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
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>
                    참여 플레이어 ({selectedIds.length}/4)
                  </Typography>
                  <List disablePadding>
                    {players.map((player) => {
                      const isSelected = selectedIds.includes(player.id);
                      const isDisabled = !isSelected && selectedIds.length >= 4;
                      return (
                        <ListItem
                          key={player.id}
                          disablePadding
                          secondaryAction={
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              edge="end"
                              onChange={() => handlePlayerToggle(player.id)}
                            />
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: isSelected ? "primary.main" : "action.disabled" }}>
                              {player.name[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={player.name}
                            secondary={isSelected ? "참여" : isDisabled ? "4명 선택됨" : "대기"}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Stack>

                {selectedIds.length === 4 && (
                  <>
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 700 }}>오야 (기준 플레이어)</Typography>
                      <FormControl>
                        <RadioGroup
                          value={dealerId}
                          onChange={(e) => setDealerId(e.target.value)}
                        >
                          {selectedPlayers.map((p) => (
                            <FormControlLabel
                              key={p.id}
                              control={<Radio />}
                              label={p.name}
                              value={p.id}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Stack>

                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 700 }}>방위 배치</Typography>
                      <Stack spacing={1}>
                        {selectedPlayers.map((p) => (
                          <Stack key={p.id} direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: "primary.main", flexShrink: 0, width: 32, height: 32, fontSize: 14 }}>
                              {p.name[0]}
                            </Avatar>
                            <Typography sx={{ flex: 1, fontSize: 14 }}>{p.name}</Typography>
                            <Select
                              displayEmpty
                              size="small"
                              sx={{ minWidth: 80 }}
                              value={seats[p.id] ?? ""}
                              onChange={(e) =>
                                setSeats((prev) => ({ ...prev, [p.id]: e.target.value as Seat }))
                              }
                            >
                              <MenuItem disabled value="">
                                선택
                              </MenuItem>
                              {availableSeats(p.id).map((s) => (
                                <MenuItem key={s} value={s}>
                                  {s}
                                </MenuItem>
                              ))}
                            </Select>
                          </Stack>
                        ))}
                      </Stack>
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
              return (
                <Stack spacing={1.5}>
                  {selectedPlayers.map((p) => (
                    <Stack key={p.id} direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: "primary.main", flexShrink: 0, width: 32, height: 32, fontSize: 14 }}>
                        {p.name[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                          {p.name}
                          {p.id === dealerId && (
                            <Typography component="span" color="primary" sx={{ fontSize: 11, ml: 0.5 }}>
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
                      {ranks[p.id] && (
                        <Box sx={{ minWidth: 32, textAlign: "center" }}>
                          <Typography
                            sx={{
                              fontSize: 16,
                              fontWeight: 900,
                              color: ranks[p.id] === 1 ? "primary.main" : "text.secondary",
                            }}
                          >
                            {ranks[p.id]}위
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  ))}
                </Stack>
              );
            })()}

            {isStep3Valid && (
              <Stack spacing={1}>
                <Paper elevation={0} sx={{ bgcolor: "background.paper", border: 1, borderColor: "primary.main", p: 1.5 }}>
                  <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon color="primary" fontSize="small" />
                    <Typography color="primary" sx={{ fontSize: 13, fontWeight: 700 }}>
                      합계 {TOTAL_RAW_SCORE.toLocaleString()}점 기준으로 계산됩니다.
                    </Typography>
                  </Stack>
                </Paper>

                <TableContainer component={Paper} elevation={0} variant="outlined">
                  <Table size="small" sx={{ minWidth: 520 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>이름</TableCell>
                        <TableCell align="right">점수</TableCell>
                        <TableCell align="right">순위</TableCell>
                        <TableCell align="right">우마</TableCell>
                        <TableCell align="right">오카</TableCell>
                        <TableCell align="right">최종</TableCell>
                        <TableCell align="right">반영</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scoreRows.map((row) => (
                        <TableRow key={row.player.id}>
                          <TableCell>{row.player.name}</TableCell>
                          <TableCell align="right">{row.rawScore.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.rank}</TableCell>
                          <TableCell align="right">{formatPoint(row.uma, true)}</TableCell>
                          <TableCell align="right">{formatPoint(row.oka, true)}</TableCell>
                          <TableCell align="right">{formatPoint(row.finalScore, true)}</TableCell>
                          <TableCell align="right">{formatPoint(row.appliedScore, true)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
          </Stack>
        )}

        {/* 하단 네비게이션 버튼 */}
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
