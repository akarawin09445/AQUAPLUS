export type Language = "TH" | "EN"
export type Theme = "dark" | "light"

export interface WQITier {
  label: { TH: string; EN: string }
  color: string
  bgColor: string
  textColor: string
  lightTextColor: string
  min: number
  max: number
}

export interface Station {
  id: string
  nameTH: string
  nameEN: string
  region: string
  regionTH: string
  lat: number
  lng: number
  electrochemical: number
  ph: number
  signalNoise: number
  temperature: number
  conductivity: number
  wqi: number
  trend: "up" | "down" | "stable"
  sensorHealth: number
  timestamp: number
  history24h: number[]
}

export interface HistoricalRecord {
  id: string
  timestamp: number
  nameTH: string
  nameEN: string
  regionTH: string
  region: string
  wqi: number
  electrochemical: number
  ph: number
}

export interface Notification {
  id: string
  severity: "critical" | "warning" | "info"
  wqi: number
  nameTH: string
  nameEN: string
  regionTH: string
  region: string
  timestamp: number
  read: boolean
}
