"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { t, formatDate } from "@/lib/i18n"
import { getTierColorClass, getTier, getTierColorForTheme, getSolutions, getWhyBreakdown, getContaminationCauses, getPhCauses, getElectrochemicalCauses, getConductivityCauses, getTemperatureCauses, getTurbidityCauses, phSubIndex, electrochemicalSubIndex, conductivitySubIndex, tempSubIndex, turbiditySubIndex } from "@/lib/wqi"
import { WqiBadge } from "@/components/WqiBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Zap, FlaskConical, Radio, Thermometer,
  ChevronRight, Lightbulb, HelpCircle, Map, ArrowLeft, AlertTriangle
} from "lucide-react"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

export function AnalysisView() {
  const { lang, stations, selectedStationId, setActiveView, setSelectedStation } = useAppStore()
  const tx = t[lang]
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  // Find the selected station (if any) — navigate from Map sets this
  const selectedStation = selectedStationId
    ? stations.find((s) => s.id === selectedStationId) ?? null
    : null

  // Build result from selected station, or null (no fallback aggregate)
  const result = selectedStation ? {
    electrochemical: selectedStation.electrochemical,
    ph: selectedStation.ph,
    signalNoise: selectedStation.signalNoise,
    temperature: selectedStation.temperature,
    conductivity: selectedStation.conductivity,
    wqi: selectedStation.wqi,
    history: selectedStation.history24h,
    timestamp: selectedStation.timestamp,
    name: lang === "TH" ? selectedStation.nameTH : selectedStation.nameEN,
    region: lang === "TH" ? selectedStation.regionTH : selectedStation.region,
  } : null
  const color = result ? getTierColorForTheme(result.wqi, isDark) : (isDark ? "#22d3ee" : "#06b6d4")
  const tier = result ? getTier(result.wqi) : null
  const whyLines = result ? getWhyBreakdown(result.electrochemical, result.ph, result.signalNoise, lang, result.temperature, result.conductivity) : []
  const solutionLines = result ? getSolutions(result.electrochemical, result.ph, result.signalNoise, lang, result.temperature, result.conductivity) : []
  const contaminationCauses = result ? getContaminationCauses(result.electrochemical, result.ph, result.signalNoise, lang, result.temperature, result.conductivity) : []

  const radarData = result
    ? [
        { subject: lang === "TH" ? "ไฟฟ้าเคมี" : "Electrochemical", value: electrochemicalSubIndex(result.electrochemical) },
        { subject: lang === "TH" ? "pH" : "pH", value: phSubIndex(result.ph) },
        { subject: lang === "TH" ? "ความขุ่น" : "Turbidity", value: turbiditySubIndex(result.signalNoise) },
        { subject: lang === "TH" ? "อุณหภูมิ" : "Temperature", value: tempSubIndex(result.temperature) },
        { subject: lang === "TH" ? "การนำไฟฟ้า" : "Conductivity", value: conductivitySubIndex(result.conductivity) },
      ]
    : []

  const lineData = result?.history.map((v, i) => ({ h: `${i}:00`, wqi: v })) ?? []

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{tx.wqiAnalysis}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {result
              ? `${result.name} · ${result.region}`
              : lang === "TH" ? "เลือกสถานีจากแผนที่เพื่อดูการวิเคราะห์" : "Select a station from the map to view analytics"}
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedStation(null); setActiveView("map") }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {lang === "TH" ? "กลับแผนที่" : "Back to Map"}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* WQI Result header */}
          <Card className="glass border-border/60">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {tx.scanResults} — {result?.name}
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-bold leading-none" style={{ color }}>{result.wqi}</span>
                    <div className="pb-1">
                      <WqiBadge wqi={result.wqi} lang={lang} size="lg" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {lang === "TH" ? "สแกนเมื่อ: " : "Scanned: "}{formatDate(result.timestamp, lang)}
                  </p>
                </div>

                {/* Telemetry quick view */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <Zap className="size-3" />, label: lang === "TH" ? "ไฟฟ้าเคมี" : "Electrochem", value: `${result.electrochemical.toFixed(3)} V`, c: isDark ? "#22d3ee" : "#0891b2" },
                    { icon: <FlaskConical className="size-3" />, label: "pH", value: result.ph.toFixed(1), c: isDark ? "#a78bfa" : "#7c3aed" },
                    { icon: <Radio className="size-3" />, label: lang === "TH" ? "ความขุ่น" : "Turbidity", value: `${(result.signalNoise * 100).toFixed(1)}%`, c: isDark ? "#f59e0b" : "#b45309" },
                    { icon: <Thermometer className="size-3" />, label: lang === "TH" ? "อุณหภูมิ" : "Temp", value: `${result.temperature.toFixed(1)}°C`, c: isDark ? "#f97316" : "#c2410c" },
                  ].map(({ icon, label, value, c }) => (
                    <div key={label} className="flex flex-col gap-0.5 px-3 py-2 rounded-lg border border-border/40 bg-muted/30">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground" style={{ color: c }}>{icon}<span style={{ color: "var(--muted-foreground)" }}>{label}</span></div>
                      <span className="text-sm font-bold" style={{ color: c }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why breakdown */}
            <Card className="glass border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="size-4 text-primary" />
                  {tx.whyScore}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {whyLines.map((line, i) => {
                  // Get sub-factor specific causes
                  let subFactorCauses: string[] = []
                  if (i === 0) subFactorCauses = getPhCauses(result!.ph, lang)
                  else if (i === 1) subFactorCauses = getElectrochemicalCauses(result!.electrochemical, lang)
                  else if (i === 2) subFactorCauses = getConductivityCauses(result!.conductivity, lang)
                  else if (i === 3) subFactorCauses = getTemperatureCauses(result!.temperature, lang)
                  else if (i === 4) subFactorCauses = getTurbidityCauses(result!.signalNoise, lang)

                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex gap-2 text-xs">
                        <ChevronRight className="size-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-muted-foreground leading-relaxed">{line}</p>
                      </div>
                      {/* Sub-factor specific causes */}
                      {subFactorCauses.length > 0 && (
                        <div className="ml-5 pl-3 border-l border-primary/30 flex flex-col gap-1">
                          {subFactorCauses.map((cause, j) => (
                            <p key={j} className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
                              • {cause}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                <Separator className="my-1" />
                <p className="text-[10px] text-muted-foreground">
                  {lang === "TH"
                    ? `WQI = (pH×0.22) + (ไฟฟ้าเคมี×0.25) + (การนำไฟฟ้า×0.20) + (อุณหภูมิ×0.13) + (ความขุ่น×0.20) = ${result.wqi}`
                    : `WQI = (pH×0.22) + (Electrochem×0.25) + (Conductivity×0.20) + (Temp×0.13) + (Turbidity×0.20) = ${result.wqi}`}
                </p>
              </CardContent>
            </Card>

            {/* Radar chart */}
            <Card className="glass border-border/60 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{lang === "TH" ? "แผนภูมิปัจจัย WQI" : "WQI Factors Chart"}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Radar name="WQI" dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Possible Contamination Sources */}
          <Card className="glass border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="size-4 text-orange-400" />
                {lang === "TH" ? "สาเหตุการปนเปื้อน" : "Possible Contamination Sources"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {contaminationCauses.map((c, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span className="size-5 rounded-full bg-orange-400/20 border border-orange-400/30 text-orange-400 flex items-center justify-center font-bold text-[10px] shrink-0">•</span>
                  <p className="text-muted-foreground leading-relaxed">{c}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Solutions */}
          <Card className="glass border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-400" />
                {tx.solutions}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {solutionLines.map((s, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span className="size-5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">{i + 1}</span>
                  <p className="text-muted-foreground leading-relaxed">{s}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 24hr history line chart */}
          <Card className="glass border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{tx.history24h}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: 32 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="h" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={5} />
                  <YAxis 
                    domain={[0, 100]} 
                    ticks={[0, 25, 50, 75, 100]} 
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    width={45}
                    allowDecimals={false}
                    interval={0}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="wqi" stroke={color} strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state — no station selected */}
      {!result && (
        <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
          <div className="size-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Map className="size-9 text-primary/60" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {lang === "TH" ? "ยังไม่ได้เลือกสถานี" : "No station selected"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {lang === "TH"
                ? "ไปที่แผนที่และคลิกที่จุดสถานีเพื่อดูการวิเคราะห์คุณภาพน้ำ"
                : "Go to the map and click a station marker to view its water quality analytics"}
            </p>
          </div>
          <button
            onClick={() => setActiveView("map")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 border border-primary/25 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
          >
            <Map className="size-4" />
            {lang === "TH" ? "ไปที่แผนที่" : "Go to Map"}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
