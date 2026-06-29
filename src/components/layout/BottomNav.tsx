"use client";

import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import HomeIcon from "@mui/icons-material/Home";
import {
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  Paper,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "홈", icon: HomeIcon, href: "/" },
  { label: "내역", icon: HistoryIcon, href: "/history" },
  { label: "랭킹", icon: BarChartIcon, href: "/rankings" },
  { label: "플레이어", icon: GroupsIcon, href: "/players" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  const showFab = pathname !== "/games/new";

  return (
    <>
      {showFab && (
        <Tooltip title="대국 기록" placement="left">
          <Fab
            aria-label="대국 기록"
            color="primary"
            component={Link}
            href="/games/new"
            sx={{
              bottom: 72,
              position: "fixed",
              right: "max(16px, calc((100vw - 430px) / 2 + 16px))",
              zIndex: (theme) => theme.zIndex.appBar,
              bgcolor: "#b5892a",
              "&:hover": { bgcolor: "#9a7222" },
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

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
          value={activeIndex}
          sx={{
            "& .MuiBottomNavigationAction-label": { fontSize: 11 },
            "& .MuiBottomNavigationAction-root": { minWidth: 0, px: 0.5 },
          }}
        >
          {navItems.map(({ label, icon: Icon, href }) => (
            <BottomNavigationAction
              key={label}
              component={Link}
              href={href}
              icon={<Icon />}
              label={label}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
}
