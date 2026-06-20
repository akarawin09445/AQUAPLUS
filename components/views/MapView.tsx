"use client"

import { useState, useEffect } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Annotation } from "react-simple-maps"
import { useAppStore } from "@/lib/store"
import { t, formatDate } from "@/lib/i18n"
import { getTierColorClass, getTier, getTierColorForTheme } from "@/lib/wqi"
import { WqiBadge } from "@/components/WqiBadge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { X, MapPin, BarChart3, Filter } from "lucide-react"
import type { Station } from "@/lib/types"
import { cn } from "@/lib/utils"

// Thailand TopoJSON from public CDN
const THAILAND_GEO =
  "https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json"

// WQI 4-tier legend — must match WQI_TIERS in wqi.ts
const LEGEND = [
  { label: { TH: "ดีมาก",   EN: "Excellent" }, color: "#10b981" },
  { label: { TH: "ดี",       EN: "Good" },      color: "#14b8a6" },
  { label: { TH: "เสี่ยง",  EN: "At Risk" },   color: "#f59e0b" },
  { label: { TH: "อันตราย", EN: "Dangerous" }, color: "#e11d48" },
]

// Jitter overlapping station coordinates so dots don't stack on each other.
// Returns a new array with adjusted [lng, lat] per station.
function resolveOverlaps(stations: Station[]): Map<string, [number, number]> {
  const THRESHOLD = 0.18 // degrees — closer than this is "overlapping"
  const STEP = 0.12      // jitter step per overlap
  const positions = new Map<string, [number, number]>()

  stations.forEach((s) => {
    let lng = s.lng
    let lat = s.lat
    let tries = 0

    // Keep nudging until no collision with already-placed dots
    while (tries < 30) {
      const collision = [...positions.values()].find(
        ([pLng, pLat]) =>
          Math.abs(pLng - lng) < THRESHOLD && Math.abs(pLat - lat) < THRESHOLD
      )
      if (!collision) break
      // Spiral nudge
      const angle = (tries * 137.5 * Math.PI) / 180 // golden angle spread
      lng = s.lng + Math.cos(angle) * STEP * Math.ceil(tries / 8 + 1)
      lat = s.lat + Math.sin(angle) * STEP * Math.ceil(tries / 8 + 1)
      tries++
    }

    positions.set(s.id, [lng, lat])
  })

  return positions
}

// Tier filter options — "all" plus each of the 4 WQI tiers
type TierFilter = "all" | "excellent" | "good" | "risk" | "danger"

const TIER_FILTERS: Array<{ key: TierFilter; labelTH: string; labelEN: string; color: string }> = [
  { key: "all",       labelTH: "ทั้งหมด",   labelEN: "All",       color: "var(--muted-foreground)" },
  { key: "excellent", labelTH: "ดีมาก",     labelEN: "Excellent", color: "#10b981" },
  { key: "good",      labelTH: "ดี",         labelEN: "Good",      color: "#14b8a6" },
  { key: "risk",      labelTH: "เสี่ยง",    labelEN: "At Risk",   color: "#f59e0b" },
  { key: "danger",    labelTH: "อันตราย",   labelEN: "Dangerous", color: "#e11d48" },
]

function matchesTierFilter(wqi: number, filter: TierFilter): boolean {
  if (filter === "all") return true
  if (filter === "excellent") return wqi <= 25
  if (filter === "good")      return wqi > 25 && wqi <= 50
  if (filter === "risk")      return wqi > 50 && wqi <= 75
  return wqi > 75
}

export function MapView() {
  const { lang, stations, setActiveView, setSelectedStation: setGlobalStation } = useAppStore()
  const tx = t[lang]
  const [selected, setSelected] = useState<Station | null>(null)
  const [zoom, setZoom] = useState(1)
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  // Apply tier filter to the station list shown on map and sidebar
  const filteredStations = stations.filter((s) => matchesTierFilter(s.wqi, tierFilter))

  // Precompute jittered positions so overlapping stations spread apart
  const jitteredPositions = resolveOverlaps(stations)

  // Dot and hit-target size scale inversely with zoom so they stay consistent on screen
  const dotR = Math.max(4, 8 / zoom)
  const hitR = Math.max(10, 22 / zoom)

  function handleMarkerClick(s: Station) {
    setSelected(s)
  }

  function handleViewAnalytics() {
    if (!selected) return
    setGlobalStation(selected.id)
    setActiveView("analysis")
  }



  const tierColor = selected ? getTierColorForTheme(selected.wqi, isDark) : (isDark ? "#22d3ee" : "#06b6d4")

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{tx.map}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === "TH"
              ? `แสดง ${filteredStations.length} / ${stations.length} สถานี`
              : `Showing ${filteredStations.length} / ${stations.length} stations`}
          </p>
        </div>
        {/* Tier filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />
          {TIER_FILTERS.map(({ key, labelTH, labelEN, color }) => (
            <button
              key={key}
              onClick={() => setTierFilter(key)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                tierFilter === key
                  ? "border-transparent text-background"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-transparent"
              )}
              style={tierFilter === key ? { backgroundColor: color, borderColor: color } : {}}
            >
              {key !== "all" && (
                <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: tierFilter === key ? "white" : color }} />
              )}
              {lang === "TH" ? labelTH : labelEN}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map */}
        <Card className="glass border-border/60 flex-1">
          <CardContent className="p-3 flex flex-col">
            <div className="w-full rounded-lg overflow-hidden" style={{ background: "var(--muted)", minHeight: 340 }}>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  center: [101.0, 13.0],
                  scale: 1600,
                }}
                style={{ width: "100%", height: "420px" }}
              >
                <ZoomableGroup
                  center={[101.0, 13.0]}
                  zoom={1}
                  minZoom={1}
                  maxZoom={8}
                  onMoveEnd={({ zoom: z }: { zoom: number }) => setZoom(z)}
                >
                  {/* Thailand provinces */}
                  <Geographies geography={THAILAND_GEO}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        // centroid fallback from bounding box
                        const bbox = geo.bbox as number[] | undefined
                        const cx = bbox ? (bbox[0] + bbox[2]) / 2 : null
                        const cy = bbox ? (bbox[1] + bbox[3]) / 2 : null
                        const props = geo.properties ?? {}
                        const provinceName: string =
                          (props.PROVINCE_E as string) ??
                          (props.name_en as string) ??
                          (props.name as string) ??
                          ""
                        return (
                          <g key={geo.rsmKey}>
                            <Geography
                              geography={geo}
                              fill="var(--muted)"
                              stroke="var(--border)"
                              strokeWidth={0.5}
                              style={{
                                default: { fill: "color-mix(in srgb, var(--primary) 12%, var(--muted))", outline: "none" },
                                hover: { fill: "color-mix(in srgb, var(--primary) 22%, var(--muted))", outline: "none" },
                                pressed: { outline: "none" },
                              }}
                            />
                            {cx !== null && cy !== null && provinceName && (
                              <Annotation
                                subject={[cx, cy]}
                                dx={0}
                                dy={0}
                                connectorProps={{}}
                              >
                                <g>
                                  {/* background label for readability */}
                                  <text
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{
                                      fontSize: 5.5,
                                      fill: "rgba(0,0,0,0.8)",
                                      pointerEvents: "none",
                                      userSelect: "none",
                                      fontWeight: "600",
                                      paintOrder: "stroke",
                                      stroke: "rgba(255,255,255,0.9)",
                                      strokeWidth: 0.3,
                                    }}
                                  >
                                    {provinceName}
                                  </text>
                                </g>
                              </Annotation>
                            )}
                          </g>
                        )
                      })
                    }
                  </Geographies>

                  {/* Station markers — filtered by tier, jittered so they never overlap */}
                  {filteredStations.map((s) => {
                    const c = getTierColorClass(s.wqi)
                    const isSelected = selected?.id === s.id
                    const coords = jitteredPositions.get(s.id) ?? [s.lng, s.lat]
                    const r = isSelected ? dotR * 1.3 : dotR
                    return (
                      <Marker
                        key={s.id}
                        coordinates={coords}
                        onClick={() => handleMarkerClick(s)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Invisible enlarged hit area — scales with zoom for easy tapping */}
                        <circle
                          r={hitR}
                          fill="transparent"
                          stroke="none"
                        />
                        {/* Selection ring */}
                        {isSelected && (
                          <circle
                            r={r + 5}
                            fill={c}
                            fillOpacity={0.18}
                            stroke={c}
                            strokeWidth={1}
                            strokeDasharray="3 2"
                          />
                        )}
                        {/* Main dot */}
                        <circle
                          r={r}
                          fill={c}
                          fillOpacity={0.92}
                          stroke="white"
                          strokeWidth={1.2}
                        />
                        {/* WQI label — only show when zoomed in enough */}
                        {zoom >= 2 && (
                          <text
                            textAnchor="middle"
                            y={r * 0.38}
                            style={{
                              fontSize: Math.max(4, r * 0.85),
                              fill: "#fff",
                              fontWeight: "bold",
                              pointerEvents: "none",
                            }}
                          >
                            {s.wqi}
                          </text>
                        )}
                      </Marker>
                    )
                  })}
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {LEGEND.map(({ label, color }) => (
                <div key={color} className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-muted-foreground">{label[lang]}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {lang === "TH" ? "เลื่อนหมุนเพื่อซูม · ลากเพื่อเลื่อน" : "Scroll to zoom · drag to pan"}
            </p>
          </CardContent>
        </Card>

        {/* Station detail drawer */}
        <div className="lg:w-72 flex flex-col gap-3">
          {selected ? (
            <Card className="glass border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" style={{ color: tierColor }} />
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {lang === "TH" ? selected.nameTH : selected.nameEN}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {lang === "TH" ? selected.regionTH : selected.region}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex items-end gap-2 mb-3">
                  <span className="text-5xl font-bold leading-none" style={{ color: tierColor }}>{selected.wqi}</span>
                  <WqiBadge wqi={selected.wqi} lang={lang} size="lg" />
                </div>

                <Separator className="mb-3" />

                <div className="flex flex-col gap-1.5 text-xs">
                  {[
                    { label: "ID", value: selected.id },
                    { label: lang === "TH" ? "ค่าไฟฟ้าเคมี" : "Electrochemical", value: `${selected.electrochemical.toFixed(3)} V` },
                    { label: "pH", value: selected.ph.toFixed(1) },
                    { label: lang === "TH" ? "อุณหภูมิ" : "Temperature", value: `${selected.temperature.toFixed(1)}°C` },
                    { label: lang === "TH" ? "สุขภาพเซ็นเซอร์" : "Sensor Health", value: `${selected.sensorHealth}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground mt-2">
                  {lang === "TH" ? "ตรวจล่าสุด: " : "Last Check: "}{formatDate(selected.timestamp, lang)}
                </p>

                <button
                  onClick={handleViewAnalytics}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all hover:bg-primary/10"
                  style={{ borderColor: tierColor, color: tierColor }}
                >
                  <BarChart3 className="size-3.5" />
                  {lang === "TH" ? "ดูการวิเคราะห์" : "View Analytics"}
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass border-border/60">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-10">
                <MapPin className="size-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground text-center">
                  {lang === "TH"
                    ? "คลิกที่จุดสถานีบนแผนที่เพื่อดูรายละเอียด"
                    : "Click a station marker on the map to view details"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Station list */}
          <Card className="glass border-border/60 flex-1">
            <CardContent className="p-2">
              <div className="text-[10px] text-muted-foreground px-2 pt-1 pb-2 uppercase tracking-wider font-medium">
                {lang === "TH" ? "สถานีทั้งหมด" : "All Stations"}
              </div>
              <div className="flex flex-col gap-0.5 overflow-y-auto max-h-72">
                {filteredStations.map((s) => {
                  const c = getTierColorForTheme(s.wqi, isDark)
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleMarkerClick(s)}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded text-left transition-colors",
                        selected?.id === s.id ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                      <span className="text-[11px] flex-1 truncate">
                        {lang === "TH" ? s.nameTH : s.nameEN}
                      </span>
                      <span className="text-[11px] font-bold shrink-0" style={{ color: c }}>{s.wqi}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
