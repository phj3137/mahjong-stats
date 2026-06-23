"use client";

import BarChartIcon from "@mui/icons-material/BarChart";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "홈", icon: HomeIcon, href: "/" },
  { label: "대국", icon: SportsEsportsIcon, href: "/games/new" },
  { label: "내역", icon: HistoryIcon, href: "/history" },
  { label: "랭킹", icon: BarChartIcon, href: "/rankings" },
  { label: "플레이어", icon: GroupsIcon, href: "/players" },
  { label: "설정", icon: SettingsIcon, href: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  return (
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
          "& .MuiBottomNavigationAction-label": { fontSize: 10 },
          "& .MuiBottomNavigationAction-root": { minWidth: 0, px: 0.5 },
        }}
      >
        {navItems.map(({ label, icon: Icon, href }) => (
          <BottomNavigationAction
            key={label}
            component={Link}
            href={href}
            icon={<Icon fontSize="small" />}
            label={label}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
