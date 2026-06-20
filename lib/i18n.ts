export const t = {
  TH: {
    appTitle: "WQI BY AQUA PLUS",
    appSubtitle: "ระบบติดตามคุณภาพน้ำแห่งชาติ",
    dashboard: "แดชบอร์ด",
    map: "แผนที่",
    wqiAnalysis: "การวิเคราะห์ WQI",
    historicalRecords: "ประวัติการตรวจ",
    notifications: "ศูนย์แจ้งเตือน",
    nationalAvg: "WQI เฉลี่ยแห่งชาติ",
    totalStations: "สถานีทั้งหมด",
    excellentStations: "ดีมาก",
    safeStations: "ดี",
    warningStations: "เสี่ยง",
    criticalStations: "อันตราย",
    dashboardHeadline: "ตรวจน้ำไว วิเคราะห์อัจฉริยะ เฝ้าระวังคุณภาพน้ำเพื่อชุมชน",
    systemHealth: "สุขภาพระบบโดยรวม",
    avgWqi: "WQI เฉลี่ย",
    lastCheck: "ตรวจล่าสุด",
    monitoringStations: "สถานีตรวจวัด",
    viewInsights: "ข้อมูลเชิงลึก",
    triggerScan: "จำลองการสแกนและประเมินผลชุดใหม่",
    scanResults: "ผลการวิเคราะห์",
    whyScore: "เหตุผลที่ได้คะแนนนี้",
    solutions: "แนวทางแก้ไข",
    sampleId: "รหัสตัวอย่าง",
    waterType: "ประเภทแหล่งน้ำ",
    waterTypeVal: "แหล่งน้ำธรรมชาติผิวดิน",
    location: "ที่ตั้ง",
    electrochemical: "ค่าไฟฟ้าเคมี",
    ph: "ความเป็นกรด-ด่าง",
    temperature: "อุณหภูมิ",
    conductivity: "ค่าการนำไฟฟ้า",
    trend: "แนวโน้ม",
    trendUp: "↑ ดีขึ้น",
    trendDown: "↓ แย่ลง",
    trendStable: "→ คงที่",
    history24h: "แนวโน้ม 24 ชั่วโมง",
    baselineMetrics: "การกระจายค่าพื้นฐาน",
    search: "ค้นหา...",
    today: "วันนี้",
    past7days: "7 วันที่ผ่านมา",
    past30days: "30 วันที่ผ่านมา",
    exportCsv: "ส่งออก CSV",
    timestamp: "เวลา",
    locationRegion: "สถานที่ & จังหวัด",
    wqiScore: "คะแนน WQI",
    status: "สถานะ",
    electrochemScore: "ค่าไฟฟ้าเคมี",
    noNotifications: "ไม่มีการแจ้งเตือนใหม่",
    sensorHealth: "สุขภาพเซ็นเซอร์",
    page: "หน้า",
    of: "จาก",
    alertBell: "การแจ้งเตือน",
    loading: "กำลังโหลด...",
    scanning: "กำลังสแกน...",
    improving: "↑ ดีขึ้น",
    degrading: "↓ แย่ลง",
    stable: "→ คงที่",
    allNotifications: "การแจ้งเตือนทั้งหมด",
    markAllRead: "ทำเครื่องหมายว่าอ่านแล้ว",
    critical: "อันตราย",
    warning: "เสี่ยง",
    info: "ข้อมูล",
    close: "ปิด",
    backToDashboard: "กลับแดชบอร์ด",
    sampleDetails: "รายละเอียดตัวอย่าง",
    autoRefresh: "รีเฟรชอัตโนมัติ",
  },
  EN: {
    appTitle: "WQI BY AQUA PLUS",
    appSubtitle: "National Water Quality Monitoring System",
    dashboard: "Dashboard",
    map: "Map",
    wqiAnalysis: "WQI Analysis",
    historicalRecords: "Historical Records",
    notifications: "Notifications",
    nationalAvg: "National WQI Average",
    totalStations: "Total Stations",
    excellentStations: "Excellent",
    safeStations: "Good",
    warningStations: "At Risk",
    criticalStations: "Dangerous",
    dashboardHeadline: "Instant Analysis, Intelligent Diagnostics: Safeguarding Community Water Supply.",
    systemHealth: "Overall System Health",
    avgWqi: "Avg. WQI",
    lastCheck: "Last Check",
    monitoringStations: "Monitoring Stations",
    viewInsights: "View Insights",
    triggerScan: "Trigger Automated Sample Generation",
    scanResults: "Scan Results",
    whyScore: "Why This Score",
    solutions: "Remediation Solutions",
    sampleId: "Sample ID",
    waterType: "Water Source Type",
    waterTypeVal: "Open Natural Water Source",
    location: "Location",
    electrochemical: "Electrochemical",
    ph: "pH Level",
    temperature: "Temperature",
    conductivity: "Conductivity",
    trend: "Trend",
    trendUp: "↑ Improving",
    trendDown: "↓ Degrading",
    trendStable: "→ Stable",
    history24h: "24-Hour Trend",
    baselineMetrics: "Baseline Metrics Distribution",
    search: "Search...",
    today: "Today",
    past7days: "Past 7 Days",
    past30days: "Past 30 Days",
    exportCsv: "Export CSV",
    timestamp: "Timestamp",
    locationRegion: "Location & Region",
    wqiScore: "WQI Score",
    status: "Status",
    electrochemScore: "Electrochemical",
    noNotifications: "No new notifications",
    sensorHealth: "Sensor Health",
    page: "Page",
    of: "of",
    alertBell: "Notifications",
    loading: "Loading...",
    scanning: "Scanning...",
    improving: "↑ Improving",
    degrading: "↓ Degrading",
    stable: "→ Stable",
    allNotifications: "All Notifications",
    markAllRead: "Mark All Read",
    critical: "Dangerous",
    warning: "At Risk",
    info: "Info",
    close: "Close",
    backToDashboard: "Back to Dashboard",
    sampleDetails: "Sample Details",
    autoRefresh: "Auto Refresh",
  },
} as const

export type TranslationKey = keyof typeof t.TH

export function formatDate(ts: number, lang: "TH" | "EN"): string {
  const d = new Date(ts)
  if (lang === "TH") {
    const thMonths = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"]
    const day = d.getDate()
    const month = thMonths[d.getMonth()]
    const year = d.getFullYear() + 543
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `${day} ${month} ${year} เวลา ${h}:${m} น.`
  } else {
    const enMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const day = d.getDate()
    const month = enMonths[d.getMonth()]
    const year = d.getFullYear()
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `${month} ${day}, ${year}, ${h}:${m}`
  }
}

export function formatDateShort(ts: number, lang: "TH" | "EN"): string {
  const d = new Date(ts)
  if (lang === "TH") {
    const thMonths = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
    return `${d.getDate()} ${thMonths[d.getMonth()]} ${d.getFullYear() + 543}`
  } else {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
}

export function formatDateTime(ts: number, lang: "TH" | "EN"): { date: string; time: string } {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  const time = `${h}:${m}`
  if (lang === "TH") {
    const thMonths = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
    return { date: `${d.getDate()} ${thMonths[d.getMonth()]} ${d.getFullYear() + 543}`, time }
  }
  return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), time }
}
