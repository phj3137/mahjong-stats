"use client";

import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const summaryStats = [
  { label: "총 대국", value: "42", note: "이번 달 8국", icon: TimelineIcon },
  { label: "평균 순위", value: "2.31", note: "최근 10국 기준", icon: BarChartIcon },
  { label: "1등률", value: "31%", note: "전월 대비 +4%", icon: EmojiEventsIcon },
];

const recentGames = [
  {
    id: 1,
    date: "06.22",
    type: "온라인 1/3배",
    players: ["현준", "민수", "지우", "서연"],
    result: "1위 현준 +42.0",
  },
  {
    id: 2,
    date: "06.18",
    type: "오프라인 1배",
    players: ["현준", "도윤", "하린", "민수"],
    result: "2위 현준 +8.5",
  },
  {
    id: 3,
    date: "06.15",
    type: "온라인 1/3배",
    players: ["지우", "현준", "서연", "도윤"],
    result: "4위 현준 -31.2",
  },
];

const players = ["현준", "민수", "지우", "서연", "도윤", "하린"];

const navItems = [
  { label: "홈", icon: HomeIcon },
  { label: "대국", icon: SportsEsportsIcon },
  { label: "내역", icon: HistoryIcon },
  { label: "통계", icon: BarChartIcon },
  { label: "플레이어", icon: GroupsIcon },
];

export default function Home() {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [gameType, setGameType] = useState("online");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([
    "현준",
    "민수",
    "지우",
    "서연",
  ]);
  const [dealer, setDealer] = useState("현준");
  const [activeNav, setActiveNav] = useState(0);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(new Date()),
    [],
  );

  const setupProgress = selectedPlayers.length / 4;
  const canStartGame = selectedPlayers.length === 4 && dealer.length > 0;

  const handlePlayerToggle = (player: string) => {
    setSelectedPlayers((currentPlayers) => {
      const isSelected = currentPlayers.includes(player);

      if (isSelected) {
        const nextPlayers = currentPlayers.filter((name) => name !== player);
        if (dealer === player) {
          setDealer(nextPlayers[0] ?? "");
        }
        return nextPlayers;
      }

      if (currentPlayers.length >= 4) {
        return currentPlayers;
      }

      const nextPlayers = [...currentPlayers, player];
      if (!dealer) {
        setDealer(player);
      }
      return nextPlayers;
    });
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{
          maxWidth: 430,
          mx: "auto",
          minHeight: "100dvh",
          px: 2,
          pt: 2,
          pb: 10,
        }}
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
            <Chip color="primary" label="진행 중 없음" size="small" />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              p: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, opacity: 0.86 }}>
                최근 대국: 06.22 온라인 1/3배
              </Typography>
              <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>
                새 대국을 시작할 준비가 됐습니다
              </Typography>
              <Button
                color="secondary"
                fullWidth
                size="large"
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setIsStartOpen(true)}
              >
                대국 시작
              </Button>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={1}>
            {summaryStats.map(({ label, value, note, icon: Icon }) => (
              <Card key={label} variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
                <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                  <Stack spacing={0.75}>
                    <Icon color="primary" fontSize="small" />
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 11, fontWeight: 800 }}
                    >
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 900 }}>
                      {value}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 10.5, lineHeight: 1.25 }}
                    >
                      {note}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Stack spacing={1.25}>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Typography sx={{ flexGrow: 1, fontSize: 18, fontWeight: 900 }}>
                최근 대국
              </Typography>
              <Button size="small">전체</Button>
            </Stack>

            <Stack spacing={1}>
              {recentGames.map((game) => (
                <Card key={game.id} variant="outlined">
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" sx={{ alignItems: "center" }}>
                        <Typography sx={{ flexGrow: 1, fontWeight: 900 }}>
                          {game.result}
                        </Typography>
                        <Chip label={game.date} size="small" />
                      </Stack>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        {game.type}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {game.players.join(" · ")}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <Paper
        elevation={8}
        sx={{
          borderRadius: 0,
          bottom: 0,
          left: "50%",
          maxWidth: 430,
          position: "fixed",
          transform: "translateX(-50%)",
          width: "100%",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <BottomNavigation
          showLabels
          value={activeNav}
          onChange={(_, nextValue: number) => setActiveNav(nextValue)}
        >
          {navItems.map(({ label, icon: Icon }) => (
            <BottomNavigationAction
              key={label}
              icon={<Icon fontSize="small" />}
              label={label}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="bottom"
        open={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              left: "50%",
              maxHeight: "88dvh",
              maxWidth: 430,
              mx: "auto",
              overflow: "hidden",
              transform: "translateX(-50%) !important",
              width: "100%",
            },
          },
        }}
      >
        <Box sx={{ maxHeight: "88dvh", overflowY: "auto", p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900 }}>
                  대국 시작
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  플레이어 {selectedPlayers.length}/4명 선택
                </Typography>
              </Box>
              <IconButton
                aria-label="닫기"
                edge="end"
                onClick={() => setIsStartOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            <LinearProgress
              value={setupProgress * 100}
              variant="determinate"
              sx={{ borderRadius: 999, height: 8 }}
            />

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>게임 유형</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                color="primary"
                value={gameType}
                onChange={(_, nextType: string | null) => {
                  if (nextType) {
                    setGameType(nextType);
                  }
                }}
              >
                <ToggleButton value="online">온라인 1/3배</ToggleButton>
                <ToggleButton value="offline">오프라인 1배</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>플레이어</Typography>
              <List disablePadding>
                {players.map((player) => {
                  const isChecked = selectedPlayers.includes(player);
                  const isDisabled = !isChecked && selectedPlayers.length >= 4;

                  return (
                    <ListItem
                      key={player}
                      disablePadding
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => handlePlayerToggle(player)}
                        />
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={player}
                        secondary={
                          isChecked ? "참여" : isDisabled ? "4명 선택됨" : "대기"
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Stack>

            <Divider />

            <FormControl>
              <Typography sx={{ mb: 1, fontWeight: 900 }}>오야</Typography>
              <RadioGroup
                value={dealer}
                onChange={(event) => setDealer(event.target.value)}
              >
                {selectedPlayers.map((player) => (
                  <FormControlLabel
                    key={player}
                    control={<Radio />}
                    label={player}
                    value={player}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Button
              disabled={!canStartGame}
              fullWidth
              size="large"
              variant="contained"
              onClick={() => setIsStartOpen(false)}
            >
              게임 시작
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
