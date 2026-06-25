"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/types";

type PlayerWithCount = Player & { gameCount: number };

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PlayerWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    const [{ data: playersData }, { data: countsData }] = await Promise.all([
      supabase.from("players").select("*").order("created_at"),
      supabase.from("game_results").select("player_id"),
    ]);

    if (!playersData) {
      setIsLoading(false);
      return;
    }

    const countMap: Record<string, number> = {};
    for (const row of countsData ?? []) {
      countMap[row.player_id] = (countMap[row.player_id] ?? 0) + 1;
    }

    setPlayers(
      playersData.map((p) => ({ ...p, gameCount: countMap[p.id] ?? 0 })),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const openAdd = () => {
    setEditingPlayer(null);
    setNameInput("");
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    setEditingPlayer(player);
    setNameInput(player.name);
    setDialogOpen(true);
  };

  const openDelete = (e: React.MouseEvent, player: PlayerWithCount) => {
    e.stopPropagation();
    setDeleteTarget(player);
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialogOpen(false);
  };

  const handleSave = async () => {
    const name = nameInput.trim();
    if (!name) return;
    setIsSaving(true);

    if (editingPlayer) {
      await supabase.from("players").update({ name }).eq("id", editingPlayer.id);
    } else {
      await supabase.from("players").insert({ name });
    }

    setIsSaving(false);
    setDialogOpen(false);
    fetchPlayers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await supabase.from("players").delete().eq("id", deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchPlayers();
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", mb: 2 }}>
          <Typography component="h1" sx={{ flexGrow: 1, fontSize: 24, fontWeight: 900 }}>
            플레이어
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {players.length}명
          </Typography>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        ) : players.length === 0 ? (
          <Box sx={{ pt: 6, textAlign: "center" }}>
            <PersonIcon sx={{ color: "text.disabled", fontSize: 48, mb: 1 }} />
            <Typography color="text.secondary">
              등록된 플레이어가 없습니다.
            </Typography>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={openAdd}>
              첫 플레이어 추가
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {players.map((player) => (
              <ListItemButton
                key={player.id}
                sx={{ py: 0.5, borderRadius: 1 }}
                onClick={() => router.push(`/players/${player.id}`)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {player.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={player.name}
                  secondary={`대국 ${player.gameCount}회`}
                />
                <IconButton
                  aria-label="수정"
                  size="small"
                  onClick={(e) => openEdit(e, player)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="삭제"
                  size="small"
                  sx={{ ml: 0.5 }}
                  onClick={(e) => openDelete(e, player)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      <Fab
        aria-label="플레이어 추가"
        color="primary"
        sx={{
          bottom: 72,
          position: "fixed",
          right: "max(16px, calc(50% - 215px + 16px))",
        }}
        onClick={openAdd}
      >
        <AddIcon />
      </Fab>

      <BottomNav />

      {/* 추가/수정 다이얼로그 */}
      <Dialog fullWidth maxWidth="xs" open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editingPlayer ? "플레이어 수정" : "플레이어 추가"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="이름"
            margin="dense"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={isSaving} onClick={closeDialog}>
            취소
          </Button>
          <Button
            disabled={!nameInput.trim() || isSaving}
            loading={isSaving}
            variant="contained"
            onClick={handleSave}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <DialogTitle>플레이어 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.gameCount
              ? `${deleteTarget.name} 플레이어를 삭제하면 관련 대국 기록도 함께 삭제됩니다. 계속하시겠습니까?`
              : `${deleteTarget?.name} 플레이어를 삭제하시겠습니까?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
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
