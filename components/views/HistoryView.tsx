"use client"

import { useState, useMemo, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { t, formatDateTime } from "@/lib/i18n"
import { getTierColorClass, getTierColorForTheme } from "@/lib/wqi"
import { WqiBadge } from "@/components/WqiBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type DateFilter = "today" | "7d" | "30d"
const PAGE_SIZE = 12

export function HistoryView() {
  const { lang, historicalRecords } = useAppStore()
  const tx = t[lang]

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d")
  const [page, setPage] = useState(1)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const now = Date.now()
  const cutoff = dateFilter === "today" ? now - 86400000 : dateFilter === "7d" ? now - 7 * 86400000 : now - 30 * 86400000

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return historicalRecords.filter((r) => {
      if (r.timestamp < cutoff) return false
      if (!q) return true
      return (
        r.nameTH.toLowerCase().includes(q) ||
        r.nameEN.toLowerCase().includes(q) ||
        r.regionTH.includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    })
  }, [historicalRecords, cutoff, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleExport() {
    const header = ["ID", "Timestamp", "Location TH", "Location EN", "Region", "WQI", "Status", "Electrochemical", "pH"]
    const rows = filtered.map((r) => [
      r.id,
      new Date(r.timestamp).toISOString(),
      r.nameTH,
      r.nameEN,
      r.region,
      r.wqi,
      lang === "TH"
        ? (r.wqi <= 25 ? "ดีมาก" : r.wqi <= 50 ? "ดี" : r.wqi <= 100 ? "ปานกลาง" : r.wqi <= 150 ? "เริ่มมีผลกระทบ" : "อันตราย")
        : (r.wqi <= 25 ? "Excellent" : r.wqi <= 50 ? "Good" : r.wqi <= 100 ? "Moderate" : r.wqi <= 150 ? "Unhealthy" : "Hazardous"),
      r.electrochemical,
      r.ph,
    ])
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `wqi-records-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{tx.historicalRecords}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length.toLocaleString()} {lang === "TH" ? "รายการ" : "records"}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-accent text-xs font-medium transition-colors"
        >
          <Download className="size-3.5" />
          {tx.exportCsv}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1) }}
            placeholder={tx.search}
            className="pl-8 h-8 text-xs bg-muted/40"
          />
        </div>
        <div className="flex gap-1">
          {([["today", tx.today], ["7d", tx.past7days], ["30d", tx.past30days]] as [DateFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setDateFilter(val); setPage(1) }}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors border",
                dateFilter === val
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="glass border-border/60 flex-1">
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{tx.timestamp}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{tx.locationRegion}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{tx.wqiScore}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{tx.status}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{lang === "TH" ? "ไฟฟ้าเคมี" : "Electrochemical"}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">pH</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      {lang === "TH" ? "ไม่พบรายการ" : "No records found"}
                    </td>
                  </tr>
                ) : (
                  paginated.map((rec, idx) => {
                    const c = getTierColorForTheme(rec.wqi, isDark)
                    const isLast = idx === paginated.length - 1
                    return (
                      <tr key={rec.id} className={cn("hover:bg-accent/30 transition-colors", !isLast && "border-b border-border/40")}>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {(() => { const { date, time } = formatDateTime(rec.timestamp, lang); return (
                            <>
                              <p className="text-muted-foreground">{date}</p>
                              <p className="text-[10px] text-muted-foreground/70">{time} {lang === "TH" ? "น." : ""}</p>
                            </>
                          )})()}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium truncate">{lang === "TH" ? rec.nameTH : rec.nameEN}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{lang === "TH" ? rec.regionTH : rec.region}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-sm" style={{ color: c }}>{rec.wqi}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <WqiBadge wqi={rec.wqi} lang={lang} size="sm" />
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{rec.electrochemical.toFixed(3)} V</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{rec.ph.toFixed(1)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          {tx.page} {currentPage} {tx.of} {totalPages}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center size-7 rounded border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          {(() => {
            const windowSize = Math.min(5, totalPages)
            const start = Math.max(1, Math.min(currentPage - Math.floor(windowSize / 2), totalPages - windowSize + 1))
            return Array.from({ length: windowSize }, (_, i) => {
              const pg = start + i
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={cn(
                    "flex items-center justify-center size-7 rounded border text-xs transition-colors",
                    currentPage === pg
                      ? "bg-primary/15 text-primary border-primary/30 font-semibold"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {pg}
                </button>
              )
            })
          })()}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center size-7 rounded border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
