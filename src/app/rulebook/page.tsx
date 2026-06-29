"use client";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import {
  Box,
  Chip,
  Divider,
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
import BottomNav from "@/components/layout/BottomNav";

const YAKU_LIST = [
  {
    han: "1판",
    items: [
      { name: "멘젠쯔모", note: "◎" },
      { name: "리치", note: "◎" },
      { name: "일발", note: "◎" },
      { name: "역패", note: "" },
      { name: "핑후", note: "◎" },
      { name: "탕야오", note: "" },
      { name: "이페코", note: "◎" },
      { name: "해저로월", note: "" },
      { name: "하저로어", note: "" },
      { name: "창깡", note: "" },
      { name: "영상개화", note: "" },
    ],
  },
  {
    han: "2판",
    items: [
      { name: "더블리치", note: "◎" },
      { name: "또이또이", note: "" },
      { name: "산안커", note: "" },
      { name: "산깡쯔", note: "" },
      { name: "소삼원", note: "" },
      { name: "혼노두", note: "" },
      { name: "삼색동각", note: "" },
      { name: "삼색동순", note: "※" },
      { name: "일기통관", note: "※" },
      { name: "찬타", note: "※" },
      { name: "치또이츠", note: "◎" },
    ],
  },
  {
    han: "3판",
    items: [
      { name: "량페코", note: "◎" },
      { name: "혼일색", note: "※" },
      { name: "준찬타", note: "※" },
    ],
  },
  {
    han: "6판",
    items: [{ name: "청일색", note: "※" }],
  },
  {
    han: "역만",
    items: [
      { name: "천화", note: "◎" },
      { name: "지화", note: "◎" },
      { name: "국사무쌍", note: "◎" },
      { name: "스안커", note: "◎" },
      { name: "대삼원", note: "" },
      { name: "자일색", note: "" },
      { name: "녹일색", note: "" },
      { name: "소사희", note: "" },
      { name: "대사희", note: "" },
      { name: "청노두", note: "" },
      { name: "스깡쯔", note: "" },
      { name: "구련보등", note: "◎" },
    ],
  },
  {
    han: "더블역만",
    items: [
      { name: "국사무쌍 13면", note: "" },
      { name: "사암각 단기", note: "" },
      { name: "순정 구련보등", note: "" },
      { name: "대사희", note: "" },
    ],
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 900, color: "primary.main", mb: 1.25, letterSpacing: 0.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
      <Typography color="primary" sx={{ fontSize: 13, flexShrink: 0, mt: "1px" }}>·</Typography>
      <Typography sx={{ fontSize: 13, lineHeight: 1.65 }}>{text}</Typography>
    </Stack>
  );
}

function SubRuleItem({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ pl: 2, py: 0.25 }}>
      <Typography color="text.disabled" sx={{ fontSize: 12, flexShrink: 0, mt: "1px" }}>·</Typography>
      <Typography color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.6 }}>{text}</Typography>
    </Stack>
  );
}

export default function RulebookPage() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100dvh" }}>
      <Box
        component="main"
        sx={{ maxWidth: 430, mx: "auto", minHeight: "100dvh", px: 2, pt: 2, pb: 10 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", mb: 2.5, gap: 1.5 }}>
          <MenuBookIcon color="primary" />
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
            룰북
          </Typography>
          <Chip label="flagon 룰" size="small" color="primary" variant="outlined" />
        </Stack>

        <Stack spacing={1.5}>
          {/* 기본 설정 */}
          <Section title="기본 설정">
            <Stack spacing={0}>
              <RuleItem text="반장전을 1회전으로 함" />
              <RuleItem text="아카도라 있음 (5만·5통·5삭 각 1장)" />
              <RuleItem text="시작점수 25,000점 · 반환점 30,000점 · 오카 20,000점" />
              <RuleItem text="10-30 우마" />
              <RuleItem text="1,000점을 1포인트로 한다" />
              <RuleItem text="동점 시 기가에 가장 가까운 쪽이 높은 순위" />
              <RuleItem text="대국 종료 후 남은 리치봉은 1위가 가진다" />
              <RuleItem text="누적 점봉은 본장 1회당 300점" />
              <RuleItem text="절상만관 사용" />
            </Stack>
          </Section>

          {/* 유국·리치 */}
          <Section title="유국 · 리치">
            <Stack spacing={0}>
              <RuleItem text="도중유국 없음 · 사깡유국도 없으나, 다섯 번째 이후 깡 금지" />
              <RuleItem text="유국 시 텐파이 선언은 동남서북 순으로 한다" />
              <RuleItem text="공탁봉이 없을 시 리치 불가" />
              <RuleItem text="후리텐 리치, 더 이상 쯔모 기회가 없는 리치 가능 · 단, 해저패로 리치 불가" />
            </Stack>
          </Section>

          {/* 깡 관련 */}
          <Section title="깡 규정">
            <Stack spacing={0}>
              <RuleItem text="깡도라는 성립된 순간 (영상패를 뽑고 타패하기 전에) 바로 공개" />
              <RuleItem text="창깡의 경우 깡이 성립하지 않으므로 깡도라 공개 안 함" />
              <RuleItem text="안깡의 창깡은 인정되지 않음 (국사무쌍의 창깡 포함)" />
            </Stack>
          </Section>

          {/* 특수 규정 */}
          <Section title="특수 규정">
            <Stack spacing={0}>
              <RuleItem text="토비 있음 — 마이너스 점수가 되는 순간 게임 종료" />
              <RuleItem text="대삼원·대사희·스깡쯔 책임지불(파오) 적용" />
              <RuleItem text="복합역만 인정" />
            </Stack>
          </Section>

          {/* 쵼보 */}
          <Section title="쵼보">
            <Stack spacing={0}>
              <RuleItem text="쵼보 발생 시 즉시 해당 국 중지, 저지른 사람은 만관 상당 점수 지불" />
              <SubRuleItem text="친: 나머지 세 명이 동일하게 나눔" />
              <SubRuleItem text="자: 친 4,000점 · 나머지 2,000점" />
              <RuleItem text="고의로 쵼보를 저질렀다고 판단된 경우 3배 적용" />

              <Divider sx={{ my: 1.25 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.5 }}>
                쵼보 해당 행위
              </Typography>
              <SubRuleItem text="정당하지 않은 화료를 선언한 뒤 손패를 공개한 경우" />
              <SubRuleItem text="노텐리치 및 리치 후 부정한 안깡 (발각되거나 유국 시 적용)" />
              <SubRuleItem text="화료 후 점봉 계산 전·뒷도라 불분명 상태에서 패산을 무너뜨린 경우" />
              <SubRuleItem text="패산과 수패를 고의로 무너뜨리거나 공개한 경우" />
              <SubRuleItem text="기타 경기 속행 불가능 수준의 반칙" />
            </Stack>
          </Section>

          {/* 화료불가 */}
          <Section title="화료불가">
            <Stack spacing={0}>
              <SubRuleItem text="다패 또는 소패" />
              <SubRuleItem text="선쯔모" />
              <SubRuleItem text="쿠이카에" />
              <SubRuleItem text="잘못된 후로 또는 발성만 하고 후로하지 않았을 경우" />
            </Stack>
          </Section>

          {/* 사용역 */}
          <Section title="사용역">
            <Stack spacing={0.5} sx={{ mb: 1.25 }}>
              <Stack direction="row" spacing={1.5}>
                <Chip icon={<Typography sx={{ fontSize: 11, fontWeight: 900 }}>◎</Typography>} label="멘젠 전용" size="small" variant="outlined" />
                <Chip icon={<Typography sx={{ fontSize: 11, fontWeight: 900 }}>※</Typography>} label="후로 시 1판 감산" size="small" variant="outlined" />
              </Stack>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12, py: 0.75, pl: 0 }}>판수</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12, py: 0.75 }}>역</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {YAKU_LIST.map(({ han, items }) => (
                    <TableRow key={han} sx={{ verticalAlign: "top" }}>
                      <TableCell
                        sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: han.includes("역만") ? "#c0392b" : "primary.main",
                          py: 1,
                          pl: 0,
                          whiteSpace: "nowrap",
                          width: 60,
                        }}
                      >
                        {han}
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {items.map(({ name, note }) => (
                            <Box key={name} sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                              <Typography sx={{ fontSize: 12 }}>{name}</Typography>
                              {note && (
                                <Typography
                                  sx={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    color: note === "◎" ? "#2d6a4f" : "#ed6c02",
                                    lineHeight: 1,
                                  }}
                                >
                                  {note}
                                </Typography>
                              )}
                              <Typography color="text.disabled" sx={{ fontSize: 11 }}> </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          {/* 온라인 */}
          <Paper
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #1a5e3a 0%, #2d6a4f 100%)",
              color: "primary.contrastText",
              p: 2,
              borderRadius: 2,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 900, opacity: 0.85, mb: 0.5 }}>
              온라인 대국
            </Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.65 }}>
              온라인 대국은 천봉만을 허용함
            </Typography>
          </Paper>
        </Stack>
      </Box>

      <BottomNav />
    </Box>
  );
}
