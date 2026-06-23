"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_SCORE_MULTIPLIERS,
  type ScoreMultiplierSettings,
} from "@/lib/scoring";

const STORAGE_KEY = "mahjong-score-multipliers";
const CHANGE_EVENT = "mahjong-score-settings-change";

let cachedRaw: string | null | undefined;
let cachedSettings = DEFAULT_SCORE_MULTIPLIERS;

function normalizeSettings(value: unknown): ScoreMultiplierSettings {
  if (!value || typeof value !== "object") return DEFAULT_SCORE_MULTIPLIERS;

  const candidate = value as Partial<Record<keyof ScoreMultiplierSettings, unknown>>;
  return {
    online:
      typeof candidate.online === "number"
        ? candidate.online
        : DEFAULT_SCORE_MULTIPLIERS.online,
    offline:
      typeof candidate.offline === "number"
        ? candidate.offline
        : DEFAULT_SCORE_MULTIPLIERS.offline,
  };
}

export function useScoreSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_SCORE_MULTIPLIERS,
  );

  const saveSettings = (next: ScoreMultiplierSettings) => {
    const normalized = normalizeSettings(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  const resetSettings = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { settings, saveSettings, resetSettings };
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSettings;

  cachedRaw = raw;
  if (!raw) {
    cachedSettings = DEFAULT_SCORE_MULTIPLIERS;
    return cachedSettings;
  }

  try {
    cachedSettings = normalizeSettings(JSON.parse(raw));
  } catch {
    cachedSettings = DEFAULT_SCORE_MULTIPLIERS;
  }

  return cachedSettings;
}
