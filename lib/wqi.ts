import type { WQITier, Station, HistoricalRecord, Notification } from "./types"

// 4 tiers: ดีมาก (0–25) | ดี (26–50) | เสี่ยง (51–75) | อันตราย (76–100)
export const WQI_TIERS: WQITier[] = [
  { min: 0,  max: 25,       label: { TH: "ดีมาก",   EN: "Excellent" }, color: "emerald", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400", lightTextColor: "text-emerald-700" },
  { min: 26, max: 50,       label: { TH: "ดี",       EN: "Good" },      color: "teal",    bgColor: "bg-teal-500/20",    textColor: "text-teal-400",   lightTextColor: "text-teal-700" },
  { min: 51, max: 75,       label: { TH: "เสี่ยง",  EN: "At Risk" },   color: "amber",   bgColor: "bg-amber-500/20",   textColor: "text-amber-400",  lightTextColor: "text-amber-700" },
  { min: 76, max: Infinity, label: { TH: "อันตราย", EN: "Critical" }, color: "rose",    bgColor: "bg-rose-600/20",    textColor: "text-rose-400",   lightTextColor: "text-rose-700" },
]

// ─── Sub-index helpers ────────────────────────────────────────────────────────
// Each returns 0–100 where 0 = perfect, 100 = worst possible for that parameter.

/** pH sub-index: ideal range 6.5–8.5 (WHO/Thai standard) */
export function phSubIndex(ph: number): number {
  if (ph >= 6.5 && ph <= 8.5) return 0
  if (ph < 6.5) return Math.min(((6.5 - ph) / 3.5) * 100, 100)   // down to pH 3
  return Math.min(((ph - 8.5) / 5.5) * 100, 100)                   // up to pH 14
}

/** Temperature sub-index: ideal 20–30 °C for tropical freshwater */
export function tempSubIndex(temp: number): number {
  if (temp >= 20 && temp <= 30) return 0
  if (temp < 20) return Math.min(((20 - temp) / 15) * 100, 100)
  return Math.min(((temp - 30) / 20) * 100, 100)
}

/** Conductivity sub-index: 0–300 µS/cm excellent, >1500 dangerous */
export function conductivitySubIndex(cond: number): number {
  if (cond <= 300)  return 0
  if (cond <= 600)  return ((cond - 300) / 300) * 25
  if (cond <= 900)  return 25 + ((cond - 600) / 300) * 25
  if (cond <= 1200) return 50 + ((cond - 900) / 300) * 30
  return Math.min(80 + ((cond - 1200) / 300) * 20, 100)
}

/** Turbidity proxy from signal noise: 0–100 linear */
export function turbiditySubIndex(signalNoise: number): number {
  return Math.min(signalNoise * 100, 100)
}

/** Electrochemical sub-index (bio-contamination proxy): 0–1 V range */
export function electrochemicalSubIndex(ec: number): number {
  // < 0.2 V = clean, > 0.8 V = highly contaminated
  if (ec <= 0.2) return 0
  return Math.min(((ec - 0.2) / 0.6) * 100, 100)
}

/**
 * Weighted WQI (0–100 scale, inverted so higher = worse for consistency
 * with Thai PCD WQI convention where higher = more polluted).
 *
 * Weights (must sum to 1.0):
 *   pH           0.22
 *   Electrochemical  0.25
 *   Conductivity 0.20
 *   Temperature  0.13
 *   Turbidity    0.20
 */
export function calcWQI(
  electrochemical: number,
  ph: number,
  signalNoise: number,
  temperature = 25,
  conductivity = 400
): number {
  const phSI   = phSubIndex(ph)
  const ecSI   = electrochemicalSubIndex(electrochemical)
  const condSI = conductivitySubIndex(conductivity)
  const tempSI = tempSubIndex(temperature)
  const turbSI = turbiditySubIndex(signalNoise)

  // Weighted sum of sub-indices (each 0–100) → result 0–100
  const wqi = (
    phSI   * 0.22 +
    ecSI   * 0.25 +
    condSI * 0.20 +
    tempSI * 0.13 +
    turbSI * 0.20
  )

  return Math.round(Math.min(Math.max(wqi, 0), 100))
}

export function getTier(wqi: number): WQITier {
  return WQI_TIERS.find((t) => wqi >= t.min && wqi <= t.max) ?? WQI_TIERS[WQI_TIERS.length - 1]
}

export function getTierColorClass(wqi: number): string {
  const tier = getTier(wqi)
  const colorMap: Record<string, string> = {
    emerald: "#10b981",
    teal: "#14b8a6",
    amber: "#f59e0b",
    rose: "#f43f5e",
  }
  return colorMap[tier.color] ?? "#888"
}

/**
 * Get theme-aware tier color for inline styling.
 * Returns lighter colors for dark mode, darker colors for light mode.
 */
export function getTierColorForTheme(wqi: number, isDark: boolean = true): string {
  const tier = getTier(wqi)
  
  if (isDark) {
    // Dark mode: use bright colors
    const darkColorMap: Record<string, string> = {
      emerald: "#34d399",
      teal: "#2dd4bf",
      amber: "#fbbf24",
      rose: "#fb7185",
    }
    return darkColorMap[tier.color] ?? "#888"
  } else {
    // Light mode: use dark saturated colors
    const lightColorMap: Record<string, string> = {
      emerald: "#059669",
      teal: "#0d9488",
      amber: "#d97706",
      rose: "#be123c",
    }
    return lightColorMap[tier.color] ?? "#333"
  }
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Water sources (แหล่งเก็บน้ำ — reservoirs & water storage only) ──────────

const WATER_SOURCES: Array<{ nameTH: string; nameEN: string; regionTH: string; region: string; lat: number; lng: number }> = [
  { nameTH: "อ่างเก็บน้ำแก่งกระจาน",         nameEN: "Kaeng Krachan Reservoir",       regionTH: "เพชรบุรี",          region: "Phetchaburi",       lat: 12.92, lng: 99.75 },
  { nameTH: "อ่างเก็บน้ำสิรินธร",            nameEN: "Sirindhorn Reservoir",          regionTH: "อุบลราชธานี",       region: "Ubon Ratchathani",  lat: 15.17, lng: 105.35 },
  { nameTH: "อ่างเก็บน้ำหนองหาร",            nameEN: "Nong Han Reservoir",            regionTH: "สกลนคร",            region: "Sakon Nakhon",      lat: 17.17, lng: 104.14 },
  { nameTH: "อ่างเก็บน้ำรัชชประภา",          nameEN: "Ratchaprapha Reservoir",        regionTH: "สุราษฎร์ธานี",     region: "Surat Thani",       lat: 8.97,  lng: 98.86 },
  { nameTH: "อ่างเก็บน้ำภูมิพล",             nameEN: "Bhumibol Reservoir",            regionTH: "ตาก",               region: "Tak",               lat: 17.24, lng: 99.03 },
  { nameTH: "อ่างเก็บน้ำสิริกิติ์",          nameEN: "Sirikit Reservoir",             regionTH: "อุตรดิตถ์",         region: "Uttaradit",         lat: 17.75, lng: 100.55 },
  { nameTH: "อ่างเก็บน้ำอุบลรัตน์",          nameEN: "Ubolrat Reservoir",             regionTH: "ขอนแก่น",           region: "Khon Kaen",         lat: 16.77, lng: 102.57 },
  { nameTH: "อ่างเก็บน้ำลำปาว",              nameEN: "Lam Pao Reservoir",             regionTH: "กาฬสินธุ์",         region: "Kalasin",           lat: 16.77, lng: 103.73 },
  { nameTH: "อ่างเก็บน้ำศรีนครินทร์",        nameEN: "Sri Nakharin Reservoir",        regionTH: "กาญจนบุรี",         region: "Kanchanaburi",      lat: 14.58, lng: 98.85 },
  { nameTH: "อ่างเก็บน้ำวชิราลงกรณ",         nameEN: "Vajiralongkorn Reservoir",      regionTH: "กาญจนบุรี",         region: "Kanchanaburi",      lat: 14.94, lng: 98.68 },
  { nameTH: "อ่างเก็บน้ำป่าสักชลสิทธิ์",    nameEN: "Pa Sak Jolasid Reservoir",      regionTH: "ลพบุรี",            region: "Lopburi",           lat: 14.96, lng: 101.09 },
  { nameTH: "อ่างเก็บน้ำทับเสลา",            nameEN: "Thap Salao Reservoir",          regionTH: "อุทัยธานี",         region: "Uthai Thani",       lat: 15.49, lng: 99.88 },
  { nameTH: "อ่างเก็บน้ำห้วยหลวง",           nameEN: "Huai Luang Reservoir",          regionTH: "อุดรธานี",          region: "Udon Thani",        lat: 17.66, lng: 102.67 },
  { nameTH: "อ่างเก็บน้ำมูลบน",              nameEN: "Mun Bon Reservoir",             regionTH: "นครราชสีมา",        region: "Nakhon Ratchasima",  lat: 14.69, lng: 102.52 },
  { nameTH: "อ่างเก็บน้ำลำตะคอง",            nameEN: "Lam Takhong Reservoir",         regionTH: "นครราชสีมา",        region: "Nakhon Ratchasima",  lat: 14.86, lng: 101.75 },
  { nameTH: "อ่างเก็บน้ำห้วยน้ำอุ่น",        nameEN: "Huai Nam Un Reservoir",         regionTH: "เชียงราย",          region: "Chiang Rai",        lat: 19.71, lng: 99.92 },
  { nameTH: "อ่างเก็บน้ำแม่งัดสมบูรณ์ชล",  nameEN: "Mae Ngat Somboon Chon Reservoir",regionTH: "เชียงใหม่",        region: "Chiang Mai",        lat: 18.95, lng: 98.88 },
  { nameTH: "อ่างเก็บน้ำห้วยแม่เปิน",        nameEN: "Huai Mae Poen Reservoir",       regionTH: "นครสวรรค์",         region: "Nakhon Sawan",      lat: 15.88, lng: 99.26 },
  { nameTH: "อ่างเก็บน้ำกระเสียว",           nameEN: "Krasiao Reservoir",             regionTH: "สุพรรณบุรี",        region: "Suphan Buri",       lat: 15.02, lng: 99.75 },
  { nameTH: "อ่างเก็บน้ำนฤบดินทรจินดา",     nameEN: "Naruebodin Chinda Reservoir",   regionTH: "ปราจีนบุรี",        region: "Prachin Buri",      lat: 14.11, lng: 102.02 },
  { nameTH: "อ่างเก็บน้ำขุนด่านปราการชล",   nameEN: "Khun Dan Prakan Chon Reservoir",regionTH: "นครนายก",          region: "Nakhon Nayok",      lat: 14.31, lng: 101.35 },
  { nameTH: "อ่างเก็บน้ำคลองท่าด่าน",        nameEN: "Khlong Tha Dan Reservoir",      regionTH: "นครนายก",           region: "Nakhon Nayok",      lat: 14.32, lng: 101.33 },
  { nameTH: "อ่างเก็บน้ำบางพระ",             nameEN: "Bang Phra Reservoir",           regionTH: "ชลบุรี",            region: "Chon Buri",         lat: 13.25, lng: 101.19 },
  { nameTH: "อ่างเก็บน้ำหนองปลาไหล",        nameEN: "Nong Pla Lai Reservoir",        regionTH: "ระยอง",             region: "Rayong",            lat: 12.85, lng: 101.46 },
  { nameTH: "อ่างเก็บน้ำดอกกราย",            nameEN: "Dok Krai Reservoir",            regionTH: "ระยอง",             region: "Rayong",            lat: 12.78, lng: 101.35 },
  { nameTH: "อ่างเก็บน้ำมาบประชัน",          nameEN: "Map Prachan Reservoir",         regionTH: "ระยอง",             region: "Rayong",            lat: 12.97, lng: 101.33 },
  { nameTH: "อ่างเก็บน้ำประแสร์",            nameEN: "Prasae Reservoir",              regionTH: "ระยอง",             region: "Rayong",            lat: 12.78, lng: 101.64 },
  { nameTH: "อ่างเก็บน้ำหนองค้อ",            nameEN: "Nong Kho Reservoir",            regionTH: "ชลบุรี",            region: "Chon Buri",         lat: 13.36, lng: 101.04 },
  { nameTH: "อ่างเก็บน้ำคลองใหญ่",           nameEN: "Khlong Yai Reservoir",          regionTH: "ตราด",              region: "Trat",              lat: 11.75, lng: 102.89 },
  { nameTH: "อ่างเก็บน้ำนายายอาม",           nameEN: "Na Yai Am Reservoir",           regionTH: "จันทบุรี",          region: "Chanthaburi",       lat: 12.98, lng: 101.93 },
  { nameTH: "อ่างเก็บน้ำคลองพระสะทึง",       nameEN: "Khlong Phra Sathung Reservoir", regionTH: "สระแก้ว",           region: "Sa Kaeo",           lat: 13.49, lng: 102.31 },
  { nameTH: "อ่างเก็บน้ำห้วยนา",             nameEN: "Hua Na Reservoir",              regionTH: "ศรีสะเกษ",          region: "Si Sa Ket",         lat: 14.93, lng: 104.19 },
  { nameTH: "อ่างเก็บน้ำห้วยขาแข้ง",         nameEN: "Huai Kha Khaeng Reservoir",     regionTH: "อุทัยธานี",         region: "Uthai Thani",       lat: 15.63, lng: 99.21 },
  { nameTH: "อ่างเก็บน้ำทุ่งสัมฤทธิ์",       nameEN: "Thung Sam Rit Reservoir",       regionTH: "นครราชสีมา",        region: "Nakhon Ratchasima", lat: 15.11, lng: 101.99 },
  { nameTH: "อ่างเก็บน้ำลำแชะ",              nameEN: "Lam Chae Reservoir",            regionTH: "นครราชสีมา",        region: "Nakhon Ratchasima", lat: 14.72, lng: 102.08 },
  { nameTH: "อ่างเก็บน้ำลำพระเพลิง",         nameEN: "Lam Phra Phloeng Reservoir",    regionTH: "นครราชสีมา",        region: "Nakhon Ratchasima", lat: 14.54, lng: 102.24 },
  { nameTH: "อ่างเก็บน้ำห้วยจระเข้มาก",      nameEN: "Huai Chorakhe Mak Reservoir",   regionTH: "บุรีรัมย์",         region: "Buri Ram",          lat: 14.68, lng: 103.19 },
  { nameTH: "อ่างเก็บน้ำห้วยสวาย",           nameEN: "Huai Sawai Reservoir",          regionTH: "สุรินทร์",          region: "Surin",             lat: 14.63, lng: 103.72 },
  { nameTH: "อ่างเก็บน้ำห้วยศรีสะอาด",       nameEN: "Huai Si Sa-at Reservoir",       regionTH: "ร้อยเอ็ด",          region: "Roi Et",            lat: 15.83, lng: 103.74 },
  { nameTH: "อ่างเก็บน้ำเชิญ",               nameEN: "Choen Reservoir",               regionTH: "ขอนแก่น",           region: "Khon Kaen",         lat: 16.11, lng: 102.19 },
  { nameTH: "อ่างเก็บน้ำห้วยกุ่ม",           nameEN: "Huai Kum Reservoir",            regionTH: "ชัยภูมิ",           region: "Chaiyaphum",        lat: 15.87, lng: 101.78 },
  { nameTH: "อ่างเก็บน้ำจุฬาภรณ์",           nameEN: "Chulabhorn Reservoir",          regionTH: "ชัยภูมิ",           region: "Chaiyaphum",        lat: 16.27, lng: 101.69 },
  { nameTH: "อ่างเก็บน้ำห้วยทราย",           nameEN: "Huai Sai Reservoir",            regionTH: "เลย",               region: "Loei",              lat: 17.28, lng: 101.73 },
  { nameTH: "อ่างเก็บน้ำน้ำอูน",             nameEN: "Nam Un Reservoir",              regionTH: "สกลนคร",            region: "Sakon Nakhon",      lat: 17.52, lng: 103.73 },
  { nameTH: "อ่างเก็บน้ำน้ำพุง",             nameEN: "Nam Phung Reservoir",           regionTH: "สกลนคร",            region: "Sakon Nakhon",      lat: 17.61, lng: 103.48 },
  { nameTH: "อ่างเ����็บน้ำกุดฉิม",             nameEN: "Kut Chim Reservoir",            regionTH: "นครพนม",            region: "Nakhon Phanom",     lat: 17.23, lng: 104.49 },
  { nameTH: "อ่างเก็บน้ำห้วยสำราญ",          nameEN: "Huai Sam Ran Reservoir",        regionTH: "ศรีสะเกษ",          region: "Si Sa Ket",         lat: 15.02, lng: 104.52 },
  { nameTH: "อ่างเก็บน้ำห้วยวังสะพุง",       nameEN: "Huai Wang Saphueng Reservoir",  regionTH: "เลย",               region: "Loei",              lat: 17.54, lng: 101.52 },
  { nameTH: "อ่างเก็บน้ำแม่สรวย",            nameEN: "Mae Suai Reservoir",            regionTH: "เชียงราย",          region: "Chiang Rai",        lat: 19.41, lng: 99.54 },
  { nameTH: "อ่างเก็บน้ำแม่ฝาง",             nameEN: "Mae Fang Reservoir",            regionTH: "เชียงใหม่",         region: "Chiang Mai",        lat: 19.89, lng: 99.21 },
  { nameTH: "อ่างเก็บน้ำแม่กวง",             nameEN: "Mae Kuang Reservoir",           regionTH: "เชียงใหม่",         region: "Chiang Mai",        lat: 18.73, lng: 99.19 },
  { nameTH: "อ่างเก็บน้ำแม่ปิงเก่า",         nameEN: "Mae Ping Kao Reservoir",        regionTH: "เชียงใหม่",         region: "Chiang Mai",        lat: 18.55, lng: 99.12 },
]

// ─── Data generators ──────────────────────────────────────────────────────────

/**
 * Generates realistic sensor readings biased toward the station's quality profile.
 * profile 0 = excellent, 1 = good, 2 = at-risk, 3 = dangerous
 */
function sensorReadings(rand: () => number, profile: number): {
  electrochemical: number; ph: number; signalNoise: number; temperature: number; conductivity: number
} {
  if (profile === 0) {
    // Excellent: clean reservoir water — all params near ideal
    return {
      electrochemical: parseFloat((0.02 + rand() * 0.08).toFixed(3)),  // 0.02–0.10 V (very clean)
      ph:              parseFloat((6.8  + rand() * 1.4).toFixed(1)),   // 6.8–8.2 (ideal)
      signalNoise:     parseFloat((0.00 + rand() * 0.10).toFixed(3)),  // 0.00–0.10 (very clear)
      temperature:     parseFloat((20   + rand() * 8).toFixed(1)),     // 20–28 °C (ideal range)
      conductivity:    parseFloat((80   + rand() * 200).toFixed(1)),   // 80–280 µS/cm (very clean)
    }
  }
  if (profile === 1) {
    // Good: slightly elevated but acceptable
    return {
      electrochemical: parseFloat((0.12 + rand() * 0.25).toFixed(3)),  // 0.12–0.37 V
      ph:              parseFloat((6.2  + rand() * 2.6).toFixed(1)),   // 6.2–8.8 (good range)
      signalNoise:     parseFloat((0.08 + rand() * 0.25).toFixed(3)),  // 0.08–0.33 (slightly turbid)
      temperature:     parseFloat((18   + rand() * 13).toFixed(1)),    // 18–31 °C
      conductivity:    parseFloat((150  + rand() * 550).toFixed(1)),   // 150–700 µS/cm
    }
  }
  if (profile === 2) {
    // At-risk: outside ideal on one or more parameters
    return {
      electrochemical: parseFloat((0.40 + rand() * 0.35).toFixed(3)),  // 0.40–0.75 V
      ph:              parseFloat((5.0  + rand() * 4.0).toFixed(1)),   // 5.0–9.0 (borderline)
      signalNoise:     parseFloat((0.35 + rand() * 0.40).toFixed(3)),  // 0.35–0.75 (noticeably turbid)
      temperature:     parseFloat((16   + rand() * 18).toFixed(1)),    // 16–34 °C (wider swings)
      conductivity:    parseFloat((600  + rand() * 700).toFixed(1)),   // 600–1300 µS/cm
    }
  }
  // Dangerous: highly polluted
  return {
    electrochemical: parseFloat((0.70 + rand() * 0.30).toFixed(3)),   // 0.70–1.00 V
    ph:              parseFloat((3.5  + rand() * 6.0).toFixed(1)),    // 3.5–9.5 (extreme)
    signalNoise:     parseFloat((0.65 + rand() * 0.35).toFixed(3)),   // 0.65–1.00 (very turbid)
    temperature:     parseFloat((12   + rand() * 24).toFixed(1)),     // 12–36 °C (extreme swings)
    conductivity:    parseFloat((1100 + rand() * 400).toFixed(1)),    // 1100–1500 µS/cm
  }
}

export function generateStations(seed: number): Station[] {
  const rand = seededRandom(seed)
  // Always use all 50 sources in a deterministic shuffled order
  const shuffled = [...WATER_SOURCES].sort(() => rand() - 0.5)

  return shuffled.map((src, i) => {
    // Distribute profiles realistically: ~30% excellent, ~45% good, ~18% at-risk, ~7% dangerous
    const roll = rand()
    const profile = roll < 0.30 ? 0 : roll < 0.75 ? 1 : roll < 0.93 ? 2 : 3
    const { electrochemical, ph, signalNoise, temperature, conductivity } = sensorReadings(rand, profile)

    const wqi = calcWQI(electrochemical, ph, signalNoise, temperature, conductivity)
    const trend = rand() < 0.33 ? "up" : rand() < 0.5 ? "down" : "stable"
    const sensorHealth = Math.round(60 + rand() * 40)
    const lat = src.lat + (rand() - 0.5) * 0.3
    const lng = src.lng + (rand() - 0.5) * 0.3

    // History: readings fluctuate within the same profile ± one tier
    const histProfile = Math.max(0, Math.min(3, profile + (rand() < 0.15 ? 1 : rand() < 0.15 ? -1 : 0)))
    const history24h = Array.from({ length: 24 }, () => {
      const r = sensorReadings(rand, histProfile)
      return calcWQI(r.electrochemical, r.ph, r.signalNoise, r.temperature, r.conductivity)
    })

    return {
      id: `WT-2026-${String(1000 + i).padStart(4, "0")}`,
      nameTH: src.nameTH,
      nameEN: src.nameEN,
      regionTH: src.regionTH,
      region: src.region,
      lat,
      lng,
      electrochemical,
      ph,
      signalNoise,
      temperature,
      conductivity,
      wqi,
      trend: trend as Station["trend"],
      sensorHealth,
      timestamp: Date.now() - Math.floor(rand() * 300000),
      history24h,
    }
  })
}

export function generateHistoricalRecords(stations: Station[], seed: number): HistoricalRecord[] {
  const rand = seededRandom(seed + 99)
  const records: HistoricalRecord[] = []
  for (let d = 0; d < 30; d++) {
    for (const st of stations) {
      if (rand() < 0.4) continue
      const roll2 = rand()
      const prof2 = roll2 < 0.30 ? 0 : roll2 < 0.75 ? 1 : roll2 < 0.93 ? 2 : 3
      const { electrochemical: e, ph: p, signalNoise: s, temperature: t, conductivity: c } = sensorReadings(rand, prof2)
      records.push({
        id: `${st.id}-D${d}`,
        timestamp: Date.now() - d * 86400000 - rand() * 86400000,
        nameTH: st.nameTH,
        nameEN: st.nameEN,
        regionTH: st.regionTH,
        region: st.region,
        wqi: calcWQI(e, p, s, t, c),
        electrochemical: e,
        ph: p,
      })
    }
  }
  return records.sort((a, b) => b.timestamp - a.timestamp)
}

export function generateNotifications(stations: Station[]): Notification[] {
  return stations
    .filter((s) => s.wqi > 50)
    .map((s) => ({
      id: `notif-${s.id}`,
      severity: s.wqi > 75 ? "critical" : "warning",
      wqi: s.wqi,
      nameTH: s.nameTH,
      nameEN: s.nameEN,
      regionTH: s.regionTH,
      region: s.region,
      timestamp: s.timestamp,
      read: false,
    })) as Notification[]
}

// ─── Analysis explanations ──────────────────────����─────────────────────────────

export function getWhyBreakdown(
  electrochemical: number,
  ph: number,
  signalNoise: number,
  lang: "TH" | "EN",
  temperature = 25,
  conductivity = 400
): string[] {
  const lines: string[] = []

  // pH
  const phSI = phSubIndex(ph)
  if (lang === "TH") {
    if (ph < 6.5)
      lines.push(`pH ${ph.toFixed(1)} — เป็นกรด (ต่ำกว่ามาตรฐาน 6.5) ส่งผลให้โลหะหนักละลายออกมาและเป็นอันตรายต่อสิ่งมีชีวิตในน้ำ (ค่า sub-index: ${phSI.toFixed(0)}/100)`)
    else if (ph > 8.5)
      lines.push(`pH ${ph.toFixed(1)} — เป็นด่าง (เกินมาตรฐาน 8.5) บ่งชี้สาหร่ายเจริญเติบโตเกินหรือสารอนินทรีย์สูง (ค่า sub-index: ${phSI.toFixed(0)}/100)`)
    else
      lines.push(`pH ${ph.toFixed(1)} — อยู่ในช่วงมาตรฐาน 6.5–8.5 เหมาะสมต่อสิ่งมีชีวิตและการใช้น้ำ (ค่า sub-index: ${phSI.toFixed(0)}/100)`)
  } else {
    if (ph < 6.5)
      lines.push(`pH ${ph.toFixed(1)} — Acidic, below safe threshold of 6.5. Increases heavy metal solubility and harms aquatic life. (sub-index: ${phSI.toFixed(0)}/100)`)
    else if (ph > 8.5)
      lines.push(`pH ${ph.toFixed(1)} — Alkaline, above safe threshold of 8.5. May indicate algal bloom or elevated inorganic compounds. (sub-index: ${phSI.toFixed(0)}/100)`)
    else
      lines.push(`pH ${ph.toFixed(1)} — Within safe range 6.5–8.5. Suitable for aquatic life and general use. (sub-index: ${phSI.toFixed(0)}/100)`)
  }

  // Conductivity
  const condSI = conductivitySubIndex(conductivity)
  if (lang === "TH") {
    if (conductivity <= 300)
      lines.push(`ค่าการนำไฟฟ้า ${conductivity.toFixed(0)} µS/cm — ดีเยี่ยม น้ำสะอาดมีแร่ธาตุน้อย (sub-index: ${condSI.toFixed(0)}/100)`)
    else if (conductivity <= 600)
      lines.push(`ค่าการนำไฟฟ้า ${conductivity.toFixed(0)} µS/cm — ยอมรับได้ แต่ควรติดตามแหล่งแร่ธาตุและการปนเปื้อนของเกลือ (sub-index: ${condSI.toFixed(0)}/100)`)
    else if (conductivity <= 1200)
      lines.push(`ค่าการนำไฟฟ้า ${conductivity.toFixed(0)} µS/cm — สูงกว่าปกติ บ่งชี้น้ำเสียอุตสาหกรรมหรือการเกษตรปนเปื้อน (sub-index: ${condSI.toFixed(0)}/100)`)
    else
      lines.push(`ค่าการนำไฟฟ้า ${conductivity.toFixed(0)} µS/cm — สูงมาก เกินค่ามาตรฐาน WHO ไม่ควรใช้เป็นน้ำดื่มหรือน้ำเพื่อการเกษตร (sub-index: ${condSI.toFixed(0)}/100)`)
  } else {
    if (conductivity <= 300)
      lines.push(`Conductivity ${conductivity.toFixed(0)} µS/cm — Excellent, low mineral content indicating clean water. (sub-index: ${condSI.toFixed(0)}/100)`)
    else if (conductivity <= 600)
      lines.push(`Conductivity ${conductivity.toFixed(0)} µS/cm — Acceptable. Monitor for salt or mineral contamination sources. (sub-index: ${condSI.toFixed(0)}/100)`)
    else if (conductivity <= 1200)
      lines.push(`Conductivity ${conductivity.toFixed(0)} µS/cm — Elevated. Likely industrial or agricultural runoff contamination. (sub-index: ${condSI.toFixed(0)}/100)`)
    else
      lines.push(`Conductivity ${conductivity.toFixed(0)} µS/cm — Very high, exceeds WHO guideline. Not suitable for drinking or irrigation. (sub-index: ${condSI.toFixed(0)}/100)`)
  }

  // Temperature
  const tempSI = tempSubIndex(temperature)
  if (lang === "TH") {
    if (temperature >= 20 && temperature <= 30)
      lines.push(`อุณหภูมิ ${temperature.toFixed(1)} °C — เหมาะสมสำหรับระบบนิเวศน้ำจืดเขตร้อน (sub-index: ${tempSI.toFixed(0)}/100)`)
    else if (temperature > 30)
      lines.push(`อุณหภูมิ ${temperature.toFixed(1)} °C — สูงเกินมาตรฐาน ลดปริมาณออกซิเจนละลายน้ำและกระตุ้นการเจริญของแบคทีเรีย (sub-index: ${tempSI.toFixed(0)}/100)`)
    else
      lines.push(`อุณหภูมิ ${temperature.toFixed(1)} °C — ต่ำกว่าช่วงเหมาะสม อาจกระทบต่อสิ่งมีชีวิตในน้ำ (sub-index: ${tempSI.toFixed(0)}/100)`)
  } else {
    if (temperature >= 20 && temperature <= 30)
      lines.push(`Temperature ${temperature.toFixed(1)} °C — Optimal for tropical freshwater ecosystems. (sub-index: ${tempSI.toFixed(0)}/100)`)
    else if (temperature > 30)
      lines.push(`Temperature ${temperature.toFixed(1)} °C — Above optimal range. Reduces dissolved oxygen and promotes bacterial growth. (sub-index: ${tempSI.toFixed(0)}/100)`)
    else
      lines.push(`Temperature ${temperature.toFixed(1)} °C — Below optimal range. May stress aquatic organisms. (sub-index: ${tempSI.toFixed(0)}/100)`)
  }

  // Electrochemical (bio-contamination proxy)
  const ecSI = electrochemicalSubIndex(electrochemical)
  if (lang === "TH") {
    if (electrochemical <= 0.2)
      lines.push(`ค่าไฟฟ้าเคมี ${electrochemical.toFixed(3)} V — ต่ำมาก บ่งชี้น้ำสะอาด ไม่พบการปนเปื้อนทางชีวภาพ (sub-index: ${ecSI.toFixed(0)}/100)`)
    else if (electrochemical <= 0.5)
      lines.push(`ค่าไฟฟ้าเคมี ${electrochemical.toFixed(3)} V — ระดับกลาง พบสัญญาณการปนเปื้อนอินทรีย์ ควรตรวจสอบเพิ่มเติม (sub-index: ${ecSI.toFixed(0)}/100)`)
    else
      lines.push(`ค่าไฟฟ้าเคมี ${electrochemical.toFixed(3)} V — สูง บ่งชี้การปนเปื้อนจุลชีพหรือสารอินทรีย์ระดับสูง อันตรายต่อสุขภาพ (sub-index: ${ecSI.toFixed(0)}/100)`)
  } else {
    if (electrochemical <= 0.2)
      lines.push(`Electrochemical ${electrochemical.toFixed(3)} V — Very low, no significant bio-contamination detected. (sub-index: ${ecSI.toFixed(0)}/100)`)
    else if (electrochemical <= 0.5)
      lines.push(`Electrochemical ${electrochemical.toFixed(3)} V — Moderate, organic contamination signals present. Further testing advised. (sub-index: ${ecSI.toFixed(0)}/100)`)
    else
      lines.push(`Electrochemical ${electrochemical.toFixed(3)} V — High, indicates significant microbial or organic contamination. Health risk present. (sub-index: ${ecSI.toFixed(0)}/100)`)
  }

  // Turbidity / signal noise
  const turbSI = turbiditySubIndex(signalNoise)
  if (lang === "TH") {
    if (signalNoise < 0.2)
      lines.push(`ความขุ่น/สัญญาณรบกวน ${(signalNoise * 100).toFixed(0)}% — น้ำใสดี การวัดเสถียร (sub-index: ${turbSI.toFixed(0)}/100)`)
    else if (signalNoise < 0.5)
      lines.push(`ความขุ่น/สัญญาณรบกวน ${(signalNoise * 100).toFixed(0)}% — มีตะกอนแขวนลอยระดับกลาง อาจมีผลต่อแสงและออกซิเจนในน้ำ (sub-index: ${turbSI.toFixed(0)}/100)`)
    else
      lines.push(`ความขุ่น/สัญญาณรบกวน ${(signalNoise * 100).toFixed(0)}% — สูง น้ำขุ่นมาก บ่งชี้ตะกอนหรือมลพิษสูง (sub-index: ${turbSI.toFixed(0)}/100)`)
  } else {
    if (signalNoise < 0.2)
      lines.push(`Turbidity/Noise ${(signalNoise * 100).toFixed(0)}% — Clear water, stable sensor readings. (sub-index: ${turbSI.toFixed(0)}/100)`)
    else if (signalNoise < 0.5)
      lines.push(`Turbidity/Noise ${(signalNoise * 100).toFixed(0)}% — Moderate suspended solids, may reduce light penetration and dissolved oxygen. (sub-index: ${turbSI.toFixed(0)}/100)`)
    else
      lines.push(`Turbidity/Noise ${(signalNoise * 100).toFixed(0)}% — High turbidity, indicating heavy sediment load or significant pollution. (sub-index: ${turbSI.toFixed(0)}/100)`)
  }

  return lines
}

/**
 * Get specific contamination causes for each sub-factor
 */
export function getPhCauses(ph: number, lang: "TH" | "EN"): string[] {
  const causes: string[] = []
  if (ph < 6.0) {
    causes.push(lang === "TH"
      ? "กรดจากการสลายตัวของสิ่งมีชีวิตและใบไม้ในน้ำ"
      : "Acidity from organic decomposition and leaf litter")
    causes.push(lang === "TH"
      ? "น้ำเสียจากโรงงานหรือที่อพยพ (mine drainage)"
      : "Industrial or mining acidic wastewater discharge")
  }
  if (ph > 8.5) {
    causes.push(lang === "TH"
      ? "การบานของสาหร่ายและน้ำปาน (eutrophication) ที่ปล่อย OH⁻"
      : "Algal blooms and aquatic plant proliferation releasing hydroxide ions")
    causes.push(lang === "TH"
      ? "คลอรีนเหลือจากระบบบำบัดน้ำแบบเคมี"
      : "Residual chlorine from chemical water treatment")
  }
  return causes
}

export function getElectrochemicalCauses(electrochemical: number, lang: "TH" | "EN"): string[] {
  const causes: string[] = []
  if (electrochemical > 0.3) {
    causes.push(lang === "TH"
      ? "แบคทีเรีย ไวรัส และจุลชีพก่อโรคจากน้ำเสียบ้านเรือน"
      : "Pathogenic bacteria, viruses, and protozoa from sewage and fecal matter")
    causes.push(lang === "TH"
      ? "สารอินทรีย์ที่สลายตัวยาก (humic acids) จากดินและพืชลำหนาง"
      : "Persistent organic matter (humic acids) from soil and decomposing vegetation")
  }
  if (electrochemical > 0.6) {
    causes.push(lang === "TH"
      ? "สารเคมีอุตสาหกรรมที่เป็นพิษ (ปตสดหรือพลาสติก)"
      : "Industrial chemical pollutants (petroleum derivatives, plasticizers)")
  }
  return causes
}

export function getConductivityCauses(conductivity: number, lang: "TH" | "EN"): string[] {
  const causes: string[] = []
  if (conductivity > 600) {
    causes.push(lang === "TH"
      ? "เกลือและแร่ธาตุที่ละลายจากดินธรรมชาติและการเดินน้ำใต้ดิน"
      : "Natural dissolved salts and minerals from groundwater sources")
  }
  if (conductivity > 900) {
    causes.push(lang === "TH"
      ? "สารปนเปื้อนจากโรงงานหรือการจราจรนำทั่ว (road salt runoff)"
      : "Industrial waste discharge or road salt/de-icing chemicals")
    causes.push(lang === "TH"
      ? "ปุ๋ยและสารเคมีเกษตรที่พัฒนาขึ้นจากนาข้าว"
      : "Agricultural fertilizers and chemical runoff from farmland")
  }
  return causes
}

export function getTemperatureCauses(temperature: number, lang: "TH" | "EN"): string[] {
  const causes: string[] = []
  if (temperature > 32) {
    causes.push(lang === "TH"
      ? "น้ำทิ้งร้อนจากโรงไฟฟ้าหรือระบบระบายความร้อนของโรงงาน"
      : "Thermal discharge from power plants or industrial cooling systems")
    causes.push(lang === "TH"
      ? "การขาดเงาและไม้ป่าตามริมน้ำ ทำให้น้ำร้อนขึ้นจากแสงแดด"
      : "Reduced riparian vegetation causing water heating from direct sunlight")
  }
  if (temperature < 18) {
    causes.push(lang === "TH"
      ? "อุณหภูมิเข้าหา 0°C หรือการปล่อยน้ำจากความลึกของอ่างเก็บน้ำ (hypolimnion)"
      : "Cold groundwater inflow or discharge from deep reservoir storage")
  }
  return causes
}

export function getTurbidityCauses(turbidity: number, lang: "TH" | "EN"): string[] {
  const causes: string[] = []
  if (turbidity > 0.3) {
    causes.push(lang === "TH"
      ? "ตะกอนจากการกัดเซาะดินตามลำธารและการไหลนอกตลิ่งเมื่อมีฝน"
      : "Suspended sediment from soil erosion and streambank runoff during floods")
    causes.push(lang === "TH"
      ? "กิจกรรมก่อสร้างและการทำเหมืองใกล้แหล่งน้ำ"
      : "Construction activities and mining operations near water bodies")
  }
  if (turbidity > 0.6) {
    causes.push(lang === "TH"
      ? "น้ำเสียจากโรงงานตัวกลาง (food, textile, paper mills) ที่มีเชื้อสาเหตุละลายตัวได้ยาก"
      : "Industrial wastewater from food, textile, and paper processing with persistent particulates")
  }
  return causes
}

export function getContaminationCauses(
  electrochemical: number,
  ph: number,
  signalNoise: number,
  lang: "TH" | "EN",
  temperature = 25,
  conductivity = 400
): string[] {
  const causes: string[] = []

  if (electrochemical > 0.5) {
    causes.push(lang === "TH"
      ? "สารปนเปื้อนจุลชีพ (แบคทีเรีย ไวรัส ก่อโรค) จากการทิ้งขยะ หรือน้ำทิ้งจากชุมชน"
      : "Microbial contamination (bacteria, viruses, pathogens) from waste disposal or domestic wastewater")
  }
  if (electrochemical > 0.7) {
    causes.push(lang === "TH"
      ? "สารเคมีอันตรายจากโรงงานหรือการใช้สารเคมีในการเกษตร (ปุ๋ย สารพิษ)"
      : "Hazardous chemicals from industrial discharge or agricultural runoff (pesticides, fertilizers)")
  }
  if (conductivity > 900) {
    causes.push(lang === "TH"
      ? "สารแร่และเกลือที่ละลายสูง อาจมาจากเหมืองหรือพื้นที่ที่มีแร่ธาตุ"
      : "High dissolved minerals and salts from mining activities or naturally mineral-rich areas")
  }
  if (ph < 6.0) {
    causes.push(lang === "TH"
      ? "กรดจากการสลายตัวของสิ่งมีชีวิตหรือน้ำเสียอุตสาหกรรม ที่มีองค์ประกอบเป็นกรด"
      : "Acidity from organic decomposition or acidic industrial discharge")
  }
  if (ph > 8.5) {
    causes.push(lang === "TH"
      ? "ความเป็นด่างเนื่องจากสาหร่ายบานเกินหรือคลอรีนเหลือจากการบำบัดน้ำ"
      : "Alkalinity from algal blooms or residual chlorine from water treatment processes")
  }
  if (signalNoise > 0.6) {
    causes.push(lang === "TH"
      ? "ตะกอนแขวนลอยสูงจากการกัดเซาะดิน การก่อสร้าง หรือกิจกรรมในการใช้ที่ดิน"
      : "High suspended sediment from soil erosion, construction activity, or land use changes")
  }
  if (temperature > 32) {
    causes.push(lang === "TH"
      ? "น้ำทิ้งร้อนจากโรงงานหรือการใช้น้ำเย็นสำหรับระบายความร้อน"
      : "Thermal discharge from power plants or industrial cooling water release")
  }

  if (causes.length === 0) {
    causes.push(lang === "TH"
      ? "ไม่พบสาเหตุการปนเปื้อนหลัก — พารามิเตอร์ทั้งหมดอยู่ในเกณฑ์ปกติ"
      : "No significant contamination sources identified — all parameters within normal ranges")
  }

  return causes
}

export function getSolutions(
  electrochemical: number,
  ph: number,
  signalNoise: number,
  lang: "TH" | "EN",
  temperature = 25,
  conductivity = 400
): string[] {
  const solutions: string[] = []

  if (ph < 6.5)
    solutions.push(lang === "TH"
      ? `ปรับค่า pH ด้วยการเติมปูนขาว Ca(OH)₂ หรือโซดาแอช Na₂CO₃ เพื่อยกระดับจาก ${ph.toFixed(1)} ให้อยู่ในช่วง 6.5–8.5`
      : `Dose hydrated lime Ca(OH)₂ or soda ash Na��CO₃ to raise pH from ${ph.toFixed(1)} into the safe range of 6.5���8.5`)
  if (ph > 8.5)
    solutions.push(lang === "TH"
      ? `ลดค่า pH ด้วยการเติมกรดคาร์บอนิก (CO₂ อัด) หรือกรดซิตริก เพื่อลดจาก ${ph.toFixed(1)} ให้อยู่ในช่วงมาตรฐาน`
      : `Reduce pH from ${ph.toFixed(1)} using CO₂ injection or citric acid dosing to bring within the 6.5–8.5 standard`)
  if (conductivity > 600)
    solutions.push(lang === "TH"
      ? `ค่าการนำไฟฟ้า ${conductivity.toFixed(0)} µS/cm — ใช้ระบบกรอง Reverse Osmosis (RO) เพื่อลดแร่ธาตุและเกลือที่ละลายอยู่`
      : `Conductivity ${conductivity.toFixed(0)} µS/cm — Deploy Reverse Osmosis (RO) filtration to reduce dissolved salts and mineral load`)
  if (conductivity > 1200)
    solutions.push(lang === "TH"
      ? "สืบหาและระงับแหล่งน้ำทิ้งอุตสาหกรรมหรือเกษตรกรรมต้นทางที่ปล่อยสารปนเปื้อนสูง"
      : "Identify and shut down upstream industrial or agricultural discharge sources causing extreme conductivity")
  if (electrochemical > 0.5)
    solutions.push(lang === "TH"
      ? `ค่าไฟฟ้าเคมี ${electrochemical.toFixed(3)} V — ติดตั้งระบบฆ่าเชื้อด้วยแสง UV และคลอรีนเพื่อกำจัดจุลชีพปนเปื้อน`
      : `Electrochemical ${electrochemical.toFixed(3)} V — Install UV sterilization and chlorination to eliminate microbial contamination`)
  if (electrochemical > 0.7)
    solutions.push(lang === "TH"
      ? "แจ้งหน่วยงานกรมควบคุมมลพิษและประกาศห้ามใช้น้ำในบริเวณนี้จนกว่าจะผ่านมาตรฐาน"
      : "Notify pollution control authority and issue water use prohibition until standards are met")
  if (temperature > 32)
    solutions.push(lang === "TH"
      ? `อุณหภูมิ ${temperature.toFixed(1)} °C — เพิ่มการไหลเวียนน้ำเพื่อลดอุณหภูมิ และตรวจหาแหล่งน้ำร้อนทิ้งจากโรงงาน`
      : `Temperature ${temperature.toFixed(1)} °C — Increase water flow/aeration and investigate thermal discharge sources nearby`)
  if (signalNoise > 0.5)
    solutions.push(lang === "TH"
      ? `ความขุ่น ${(signalNoise * 100).toFixed(0)}% — ติดตั้งระบบตกตะกอนและกรองทรายก่อนจุดวัด เพื่อลดตะกอนแขวนลอย`
      : `Turbidity ${(signalNoise * 100).toFixed(0)}% — Install coagulation-flocculation and sand filtration upstream to reduce suspended solids`)

  if (solutions.length === 0)
    solutions.push(lang === "TH"
      ? "พารามิเตอร์ทุกรายการอยู่ในเกณฑ์มาตรฐาน — แนะนำให้ตรวจสอบตามรอบปกติและบันทึกค่าเพื่อการเปรียบเทียบระยะยาว"
      : "All parameters within standard thresholds — maintain regular monitoring schedule and log readings for long-term trend analysis")
  return solutions
}
