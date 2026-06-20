"use client"

import { useAppStore } from "@/lib/store"
import { t } from "@/lib/i18n"
import { getTier, getTierColorClass } from "@/lib/wqi"
import { Bell, Sun, Moon, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function TopNav() {
  const { lang, theme, stations, notifications, setLang, setTheme, setActiveView, refreshData } = useAppStore()
  const tx = t[lang]
  const unread = notifications.filter((n) => !n.read).length

  const avgWqi =
    stations.length > 0 ? Math.round(stations.reduce((s, st) => s + st.wqi, 0) / stations.length) : 0

  const tier = getTier(avgWqi)
  const tierColor = getTierColorClass(avgWqi)

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border glass bg-card/60 shrink-0 z-10">
      {/* National WQI Average */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{tx.nationalAvg}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-bold leading-none" style={{ color: tierColor }}>
              {avgWqi}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                tier.bgColor, tier.textColor
              )}
              style={{ borderColor: `${tierColor}40` }}
            >
              {tier.label[lang]}
            </span>
          </div>
        </div>
        {/* Pulse indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-muted-foreground">LIVE</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Scan button - regenerates dataset only, no navigation */}
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-semibold text-primary"
          aria-label={lang === "TH" ? "สแกน" : "Scan"}
        >
          <RefreshCw className="size-3" />
          <span className="hidden sm:inline">{lang === "TH" ? "สแกน" : "Scan"}</span>
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "TH" ? "EN" : "TH")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-accent transition-colors text-xs font-semibold text-foreground"
        >
          <span className={cn("transition-colors", lang === "TH" ? "text-primary" : "text-muted-foreground")}>TH</span>
          <span className="text-muted-foreground/50">/</span>
          <span className={cn("transition-colors", lang === "EN" ? "text-primary" : "text-muted-foreground")}>EN</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center size-8 rounded-lg border border-border bg-muted/50 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Alert bell */}
        <button
          onClick={() => setActiveView("notifications")}
          className="relative flex items-center justify-center size-8 rounded-lg border border-border bg-muted/50 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label={tx.alertBell}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
