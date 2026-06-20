"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { t } from "@/lib/i18n"
import {
  LayoutDashboard,
  Map,
  BarChart3,
  History,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const NAV_ITEMS = [
  { key: "dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { key: "map", icon: Map, labelKey: "map" as const },
  { key: "analysis", icon: BarChart3, labelKey: "wqiAnalysis" as const },
  { key: "history", icon: History, labelKey: "historicalRecords" as const },
  { key: "notifications", icon: Bell, labelKey: "notifications" as const },
]

export function Sidebar() {
  const { lang, theme, sidebarCollapsed, activeView, setActiveView, toggleSidebar, notifications } = useAppStore()
  const tx = t[lang]
  const unread = notifications.filter((n) => !n.read).length

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 border-r border-border glass",
        "bg-sidebar/80",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-border glass", sidebarCollapsed && "justify-center px-2")}>
        <div className="flex items-center justify-center shrink-0">
          <Image 
            src="/aqua-plus-logo.png" 
            alt="AQUA PLUS WQI Monitor" 
            width={60} 
            height={60}
            className="object-contain"
          />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-xs font-bold text-primary tracking-wide leading-none">AQUA PLUS</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">WQI Monitor</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ key, icon: Icon, labelKey }) => {
          const isActive = activeView === key
          const label = tx[labelKey]
          const showBadge = key === "notifications" && unread > 0

          const btn = (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                "relative",
                isActive
                  ? "bg-primary/15 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              <div className="relative shrink-0">
                <Icon className="size-[18px]" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 size-3.5 rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center font-bold leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </button>
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip key={key}>
                <TooltipTrigger render={btn} />
                <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
              </Tooltip>
            )
          }
          return btn
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
    </aside>
  )
}
