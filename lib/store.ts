"use client"

import { create } from "zustand"
import type { Language, Theme, Station, HistoricalRecord, Notification } from "./types"
import { generateStations, generateHistoricalRecords, generateNotifications, calcWQI } from "./wqi"

const PAGE_SEED = typeof window !== "undefined" ? Date.now() : 0

export interface SampleResult {
  electrochemical: number
  ph: number
  signalNoise: number
  temperature: number
  conductivity: number
  wqi: number
  id: string
  history: number[]
  timestamp: number
}

interface NotificationFilters {
  severity: "all" | "critical" | "warning"
  readStatus: "all" | "unread" | "read"
}

interface AppState {
  lang: Language
  theme: Theme
  sidebarCollapsed: boolean
  activeView: string
  selectedStationId: string | null
  stations: Station[]
  historicalRecords: HistoricalRecord[]
  notifications: Notification[]
  seed: number
  refreshTick: number
  currentSample: SampleResult | null
  sampleGenerating: boolean
  notificationFilters: NotificationFilters

  setLang: (l: Language) => void
  setTheme: (t: Theme) => void
  toggleSidebar: () => void
  setActiveView: (v: string) => void
  setSelectedStation: (id: string | null) => void
  refreshData: () => void
  markAllNotificationsRead: () => void
  generateSample: () => void
  setNotificationFilter: (filters: Partial<NotificationFilters>) => void
  markNotificationRead: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => {
  const seed = PAGE_SEED
  const stations = generateStations(seed)
  const historicalRecords = generateHistoricalRecords(stations, seed)
  const notifications = generateNotifications(stations)

  return {
    lang: "TH",
    theme: "dark",
    sidebarCollapsed: false,
    activeView: "dashboard",
    selectedStationId: null,
    stations,
    historicalRecords,
    notifications,
    seed,
    refreshTick: 0,
    currentSample: null,
    sampleGenerating: false,
    notificationFilters: { severity: "all", readStatus: "all" },

    setLang: (l) => set({ lang: l }),
    setTheme: (t) => set({ theme: t }),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setActiveView: (v) => set({ activeView: v }),
    setSelectedStation: (id) => set({ selectedStationId: id }),

    refreshData: () => {
      const newSeed = Date.now()
      const newStations = generateStations(newSeed)
      const newHistory = generateHistoricalRecords(newStations, newSeed)
      const newNotifs = generateNotifications(newStations)
      set({
        seed: newSeed,
        stations: newStations,
        historicalRecords: newHistory,
        notifications: newNotifs,
        refreshTick: get().refreshTick + 1,
        selectedStationId: null,
      })
    },

    generateSample: () => {
      set({ sampleGenerating: true })
      setTimeout(() => {
        const stationsSnap = get().stations
        if (stationsSnap.length === 0) {
          set({ sampleGenerating: false })
          return
        }
        
        // Analyze all current stations to create an aggregate sample
        const avgElectrochemical = stationsSnap.reduce((s, st) => s + st.electrochemical, 0) / stationsSnap.length
        const avgPh = stationsSnap.reduce((s, st) => s + st.ph, 0) / stationsSnap.length
        const avgSignalNoise = stationsSnap.reduce((s, st) => s + st.signalNoise, 0) / stationsSnap.length
        const avgTemperature = stationsSnap.reduce((s, st) => s + st.temperature, 0) / stationsSnap.length
        const avgConductivity = stationsSnap.reduce((s, st) => s + st.conductivity, 0) / stationsSnap.length
        
        const wqi = Math.round(calcWQI(avgElectrochemical, avgPh, avgSignalNoise))
        const id = `ANALYSIS-${stationsSnap.length}-STATIONS`
        
        // Aggregate 24h history across all stations
        const history = Array.from({ length: 24 }, (_, i) => {
          const avgAtHour = stationsSnap.reduce((s, st) => s + (st.history24h[i] ?? 50), 0) / stationsSnap.length
          return Math.round(avgAtHour)
        })
        
        set({
          currentSample: {
            electrochemical: parseFloat(avgElectrochemical.toFixed(3)),
            ph: parseFloat(avgPh.toFixed(1)),
            signalNoise: parseFloat(avgSignalNoise.toFixed(3)),
            temperature: parseFloat(avgTemperature.toFixed(1)),
            conductivity: parseFloat(avgConductivity.toFixed(1)),
            wqi,
            id,
            history,
            timestamp: Date.now()
          },
          sampleGenerating: false,
        })
      }, 1500)
    },

    markAllNotificationsRead: () =>
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      })),

    setNotificationFilter: (filters) =>
      set((s) => ({
        notificationFilters: { ...s.notificationFilters, ...filters },
      })),

    markNotificationRead: (id) =>
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
  }
})
