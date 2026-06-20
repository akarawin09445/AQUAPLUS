"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { t, formatDate } from "@/lib/i18n"
import { getTier, getTierColorClass, getTierColorForTheme } from "@/lib/wqi"
import { WqiBadge } from "@/components/WqiBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Activity, Droplets, AlertTriangle, XCircle, CheckCircle2, Star } from "lucide-react"
import {
  ComposedChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Scatter,
  type ScatterShapeProps,
} from "recharts"
import { cn } from "@/lib/utils"

// ── Helpers ───────────────────────────────────────────────────────────────────
function tierColor(wqi: number, isDark: boolean = true): string {
  if (isDark) {
    if (wqi <= 25) return "#10b981"
    if (wqi <= 50) return "#14b8a6"
    if (wqi <= 75) return "#f59e0b"
    return "#e11d48"
  } else {
    // Light mode: darker saturated colors
    if (wqi <= 25) return "#059669"
    if (wqi <= 50) return "#0d9488"
    if (wqi <= 75) return "#d97706"
    return "#be123c"
  }
}

const TIER_LEGEND = [
  { labelTH: "ดีมาก",   labelEN: "Excellent", color: "#10b981" },
  { labelTH: "ดี",       labelEN: "Good",      color: "#14b8a6" },
  { labelTH: "เสี่ยง",  labelEN: "At Risk",   color: "#f59e0b" },
  { labelTH: "อันตราย", labelEN: "Dangerous", color: "#e11d48" },
]

// ── KPI card ──────────────────────────────────────────────────────────────────
interface KpiCardProps { label: string; value: number | string; icon: React.ReactNode; color: string }
function KpiCard({ label, value, icon, color }: KpiCardProps) {
  return (
    <Card className="glass border-border/60">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Custom dot per station ────────────────────────────────────────────────────
interface DotProps extends ScatterShapeProps { wqi?: number; r?: number }
function StationDot({ cx, cy, wqi }: DotProps) {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const textColor = isDarkMode ? '#e5e7eb' : '#020202'
  const strokeColor = isDarkMode ? '#0f172a' : '#f5f5f5'
  
  if (cx == null || cy == null || wqi == null) return null
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={tierColor(wqi, isDarkMode)}
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill={textColor}
        pointerEvents="none"
      >
        {wqi}
      </text>
    </g>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function DashboardView() {
  const { lang, stations } = useAppStore()
  const tx = t[lang]
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const total = stations.length
  const excellent = stations.filter((s) => s.wqi <= 25).length
  const good      = stations.filter((s) => s.wqi > 25 && s.wqi <= 50).length
  const warning   = stations.filter((s) => s.wqi > 50 && s.wqi <= 75).length
  const critical  = stations.filter((s) => s.wqi > 75).length
  const avgWqi    = total > 0 ? Math.round(stations.reduce((s, st) => s + st.wqi, 0) / total) : 0
  const avgColor  = getTierColorForTheme(avgWqi, isDark)

  // Build chart data — one point per station with current WQI
  const chartData = stations.map((s, i) => ({ index: i + 1, name: lang === "TH" ? s.nameTH : s.nameEN, id: s.id, wqi: s.wqi }))

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground text-balance leading-snug max-w-2xl">
          {tx.dashboardHeadline}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === "TH" ? "ตรวจล่าสุด: " : "Last Check: "}{formatDate(Date.now(), lang)}
        </p>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={tx.excellentStations} value={excellent} icon={<Star className="size-4" />}          color="#10b981" />
        <KpiCard label={tx.safeStations}      value={good}      icon={<CheckCircle2 className="size-4" />}  color="#14b8a6" />
        <KpiCard label={tx.warningStations}   value={warning}   icon={<AlertTriangle className="size-4" />} color="#f59e0b" />
        <KpiCard label={tx.criticalStations}  value={critical}  icon={<XCircle className="size-4" />}       color="#e11d48" />
      </div>

      {/* System Health chart */}
      <Card className="glass border-border/60 overflow-visible">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              {tx.systemHealth}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: avgColor }}>{avgWqi}</span>
              <WqiBadge wqi={avgWqi} lang={lang} size="sm" />
              <Separator orientation="vertical" className="h-4 mx-1" />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Droplets className="size-3" />
                {lang === "TH" ? `สถานีทั้งหมด ${total}` : `${total} stations`}
              </span>
            </div>
          </div>
          {/* Tier legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {TIER_LEGEND.map(({ labelTH, labelEN, color }) => (
              <div key={color} className="flex items-center gap-1">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-muted-foreground">{lang === "TH" ? labelTH : labelEN}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-1 pb-4 px-4">
          {/* Horizontally scrollable chart — 36 px per station keeps dots well-spaced */}
          <div className="overflow-x-auto">
            <div style={{ width: Math.max(total * 36, 480) }}>
              <ComposedChart
                width={Math.max(total * 36, 480)}
                height={220}
                data={chartData}
                margin={{ top: 16, right: 32, bottom: 16, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="index"
                  type="number"
                  domain={[0, total + 1]}
                  tickCount={total + 2}
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  label={{ value: lang === "TH" ? "สถานี" : "Station #", position: "insideBottom", offset: -6, fontSize: 9, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  width={48}
                  interval={0}
                  allowDecimals={false}
                  tickFormatter={(v: number) => `${v}`}
                  label={{ value: "WQI", angle: -90, position: "insideLeft", offset: 12, fontSize: 9, fill: "var(--muted-foreground)" }}
                />
                {/* Tier threshold dashes */}
                <ReferenceLine y={25} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.3} />
                <ReferenceLine y={50} stroke="#14b8a6" strokeDasharray="4 3" strokeOpacity={0.3} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.3} />
                <Tooltip
                  cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 2" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as typeof chartData[0]
                    const tier = getTier(d.wqi)
                    return (
                      <div
                        className="px-3 py-2 flex flex-col gap-0.5 rounded-lg"
                        style={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }}
                      >
                        <p className="font-semibold text-foreground text-xs">#{d.index} {d.name}</p>
                        <p className="text-[10px] text-muted-foreground">{d.id}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold" style={{ color: tierColor(d.wqi, isDark) }}>{d.wqi}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded", tier?.bgColor, tier?.textColor)}>
                            {tier?.label[lang]}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
                {/* Curved average trend line through all station dots */}
                <Line
                  type="monotone"
                  dataKey="wqi"
                  stroke={avgColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
                {/* Colored dots — one per station on top of the line */}
                <Scatter
                  dataKey="wqi"
                  shape={(props: ScatterShapeProps) => (
                    <StationDot {...props} wqi={(props as DotProps).wqi} />
                  )}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </div>
          </div>

          {/* Station list — 6 rows visible, scrollable to all stations */}
          <div className="mt-3 border-t border-border/50 pt-3 overflow-y-auto flex flex-col gap-1" style={{ maxHeight: "288px" }}>
            {chartData.map((d) => {
              const tier = getTier(d.wqi)
              const c = tierColor(d.wqi, isDark)
              return (
                <button
                  key={d.id}
                  disabled
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 text-left w-full shrink-0 opacity-60 cursor-default"
                >
                  <span className="text-[10px] text-muted-foreground shrink-0 w-5 text-right font-mono">#{d.index}</span>
                  <span className="text-[11px] truncate flex-1 text-foreground">{d.name}</span>
                  <span className="text-[12px] font-bold shrink-0" style={{ color: c }}>{d.wqi}</span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded shrink-0", tier?.bgColor, tier?.textColor)}>
                    {tier?.label[lang]}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
