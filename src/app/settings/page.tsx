"use client";

import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useScoreSettings } from "@/lib/score-settings";
import {
  DEFAULT_SCORE_MULTIPLIERS,
  formatMultiplier,
  type ScoreMultiplierSettings,
} from "@/lib/scoring";

const SETTING_FIELDS: Array<{
  key: keyof ScoreMultiplierSettings;
  label: string;
}> = [
  { key: "online", label: "온라인 반영도" },
  { key: "offline", label: "오프라인 반영도" },
];

export default function SettingsPage() {
  const { settings, saveSettings, resetSettings } = useScoreSettings();
  const [message, setMessage] = useState("");

  const updateMultiplier = (key: keyof ScoreMultiplierSettings, value: string) => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue < 0) return;

    saveSettings({
      ...settings,
      [key]: nextValue,
    });
    setMessage("배율 설정이 저장되었습니다.");
  };

  const handleReset = () => {
    resetSettings();
    setMessage("기본 배율로 되돌렸습니다.");
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography component="h1" sx={{ flex: 1, fontSize: 24, fontWeight: 900 }}>
              설정
            </Typography>
          </Stack>

          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
                점수 반영도
              </Typography>
              {SETTING_FIELDS.map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  label={field.label}
                  size="small"
                  type="number"
                  value={settings[field.key]}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 0.01,
                    },
                    input: {
                      endAdornment: <InputAdornment position="end">배</InputAdornment>,
                    },
                  }}
                  onChange={(event) => updateMultiplier(field.key, event.target.value)}
                />
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ bgcolor: "background.paper", p: 1.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.6 }}>
              기본값은 온라인 {formatMultiplier(DEFAULT_SCORE_MULTIPLIERS.online)}배,
              오프라인 {formatMultiplier(DEFAULT_SCORE_MULTIPLIERS.offline)}배입니다.
            </Typography>
          </Paper>

          <Button
            color="inherit"
            startIcon={<RestartAltIcon />}
            variant="outlined"
            onClick={handleReset}
          >
            기본값으로 되돌리기
          </Button>
        </Stack>
      </Box>

      <BottomNav />

      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={1600}
        message={message}
        open={message !== ""}
        sx={{ bottom: { xs: 88, sm: 24 } }}
        onClose={() => setMessage("")}
      />
    </Box>
  );
}
