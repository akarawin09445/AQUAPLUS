"use client"

import { useAppStore } from "@/lib/store"
import { t, formatDate } from "@/lib/i18n"
import { getTierColorClass } from "@/lib/wqi"
import { WqiBadge } from "@/components/WqiBadge"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, BellOff, AlertTriangle, ShieldAlert, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotificationsView() {
  const { lang, notifications, markAllNotificationsRead, markNotificationRead, notificationFilters, setNotificationFilter } = useAppStore()
  const tx = t[lang]

  // Apply filters
  let filtered = notifications
  if (notificationFilters.severity !== "all") {
    filtered = filtered.filter((n) => n.severity === notificationFilters.severity)
  }
  if (notificationFilters.readStatus !== "all") {
    filtered = filtered.filter((n) =>
      notificationFilters.readStatus === "unread" ? !n.read : n.read
    )
  }

  const unread = filtered.filter((n) => !n.read).length
  // 4-tier split: ดีมาก+ดี = safe (wqi<=50), เสี่ยง = warning (51–75), อันตราย = critical (76+)
  const critical = filtered.filter((n) => n.severity === "critical")  // wqi > 75
  const warning = filtered.filter((n) => n.severity === "warning")    // wqi 51–75

  function severityIcon(sev: string) {
    if (sev === "critical") return <ShieldAlert className="size-4 text-rose-400" />
    if (sev === "warning") return <AlertTriangle className="size-4 text-amber-400" />
    return <AlertTriangle className="size-4 text-sky-400" />
  }

  function severityLabel(sev: string) {
    if (sev === "critical") return tx.critical
    if (sev === "warning") return tx.warning
    return tx.info
  }

  function severityColor(sev: string) {
    if (sev === "critical") return "#e11d48"
    if (sev === "warning") return "#f59e0b"
    return "#38bdf8"
  }

  function buildMessage(n: typeof notifications[0]) {
    const locName = lang === "TH" ? `${n.nameTH} จ.${n.regionTH}` : `${n.nameEN}, ${n.region}`
    if (lang === "TH") {
      if (n.severity === "critical")
        return `[วิกฤต WQI ${n.wqi}] ตรวจพบการปนเปื้อนในระดับอันตราย ณ ${locName}`
      if (n.severity === "warning")
        return `[เตือน WQI ${n.wqi}] ค่าคุณภาพน้ำเริ่มมีผลกระทบ ณ ${locName} — ควรตรวจสอบ`
      return `[ข้อมูล WQI ${n.wqi}] คุณภาพน้ำระดับปานกลาง ณ ${locName}`
    } else {
      if (n.severity === "critical")
        return `[Critical WQI ${n.wqi}] High contamination biohazard risk detected at ${locName}`
      if (n.severity === "warning")
        return `[Warning WQI ${n.wqi}] Degraded water quality threshold exceeded at ${locName} — inspection advised`
      return `[Info WQI ${n.wqi}] Moderate water quality status at ${locName}`
    }
  }

  const allGroups = [
      { label: tx.critical, items: critical, color: "#e11d48" },
      { label: tx.warning,  items: warning,  color: "#f59e0b" },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{tx.allNotifications}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length > 0
              ? `${filtered.length} ${lang === "TH" ? "การแจ้งเตือน" : "notifications"}`
              : (lang === "TH" ? "ไม่มีการแจ้งเตือน" : "No notifications")}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-accent text-xs font-medium transition-colors"
          >
            <CheckCheck className="size-3.5" />
            {tx.markAllRead}
          </button>
        )}
      </div>



      {/* Filter controls (compact inline) */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {lang === "TH" ? "ความรุนแรง" : "Severity"}
          </p>
          <div className="flex gap-1.5">
            {[
              { value: "all" as const, label: lang === "TH" ? "ทั้งหมด" : "All" },
              { value: "critical" as const, label: tx.critical },
              { value: "warning" as const, label: tx.warning },
            ].map(({ value, label }) => (
              <button
                key={`severity-${value}`}
                onClick={() => setNotificationFilter({ severity: value })}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                  notificationFilters.severity === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {lang === "TH" ? "สถานะการอ่าน" : "Read Status"}
          </p>
          <div className="flex gap-1.5">
            {[
              { value: "all" as const, label: lang === "TH" ? "ทั้งหมด" : "All" },
              { value: "unread" as const, label: lang === "TH" ? "ยังไม่อ่าน" : "Unread" },
              { value: "read" as const, label: lang === "TH" ? "อ่านแล้ว" : "Read" },
            ].map(({ value, label }) => (
              <button
                key={`read-${value}`}
                onClick={() => setNotificationFilter({ readStatus: value })}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                  notificationFilters.readStatus === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row — เสี่ยง and อันตราย only */}
      <div className="grid grid-cols-2 gap-3">
        {[
      { label: tx.warning,  count: warning.length,  color: "#f59e0b", icon: <AlertTriangle className="size-4" /> },
      { label: tx.critical, count: critical.length, color: "#e11d48", icon: <ShieldAlert className="size-4" /> },
        ].map(({ label, count, color, icon }) => (
          <Card key={label} className="glass border-border/60">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
                <span style={{ color }}>{icon}</span>
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ color }}>{count}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <BellOff className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {notifications.length === 0 ? tx.noNotifications : (lang === "TH" ? "ไม่มีการแจ้งเตือนตรงตามตัวกรอง" : "No notifications match your filters")}
          </p>
        </div>
      )}

      {/* Notification groups */}
      {allGroups.map(({ label, items, color }) => (
        <div key={label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2" style={{ color }}>{label}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {items.map((notif) => {
            const c = getTierColorClass(notif.wqi)
            return (
              <Card
                key={notif.id}
                className={cn(
                  "glass border-border/60 transition-all cursor-pointer hover:border-primary/50",
                  !notif.read && "border-l-2",
                )}
                style={!notif.read ? { borderLeftColor: severityColor(notif.severity) } : {}}
                onClick={() => markNotificationRead(notif.id)}
              >
                <CardContent className="p-3 flex gap-3">
                  <div className="shrink-0 mt-0.5">{severityIcon(notif.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">{buildMessage(notif)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <WqiBadge wqi={notif.wqi} lang={lang} size="sm" />
                      <span className="text-[10px] text-muted-foreground">{formatDate(notif.timestamp, lang)}</span>
                      {!notif.read && (
                        <span className="text-[9px] font-bold text-primary ml-auto uppercase tracking-wide">
                          {lang === "TH" ? "ใหม่" : "New"}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ))}
    </div>
  )
}
