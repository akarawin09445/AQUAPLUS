"use client"

import { useAppStore } from "@/lib/store"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopNav } from "@/components/layout/TopNav"
import { DashboardView } from "@/components/views/DashboardView"
import { MapView } from "@/components/views/MapView"
import { AnalysisView } from "@/components/views/AnalysisView"
import { HistoryView } from "@/components/views/HistoryView"
import { NotificationsView } from "@/components/views/NotificationsView"
import { ThemeSync } from "@/components/ThemeSync"
import { TooltipProvider } from "@/components/ui/tooltip"

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView)
  switch (activeView) {
    case "dashboard": return <DashboardView />
    case "map": return <MapView />
    case "analysis": return <AnalysisView />
    case "history": return <HistoryView />
    case "notifications": return <NotificationsView />
    default: return <DashboardView />
  }
}

export function AppShell() {
  return (
    <TooltipProvider>
      <ThemeSync />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopNav />
          <main className="flex-1 min-h-0 overflow-hidden">
            <ViewRouter />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
