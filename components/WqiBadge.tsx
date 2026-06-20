"use client"

import { getTier, getTierColorClass } from "@/lib/wqi"
import { cn } from "@/lib/utils"
import type { Language } from "@/lib/types"
import { useEffect, useState } from "react"

interface WqiBadgeProps {
  wqi: number
  lang: Language
  size?: "sm" | "md" | "lg"
}

export function WqiBadge({ wqi, lang, size = "md" }: WqiBadgeProps) {
  const [isDark, setIsDark] = useState(true)
  
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const tier = getTier(wqi)
  const color = getTierColorClass(wqi)
  const textColorClass = isDark ? tier.textColor : tier.lightTextColor

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-md border",
        tier.bgColor, textColorClass,
        size === "sm" && "text-[10px] px-1.5 py-0.5",
        size === "md" && "text-xs px-2 py-0.5",
        size === "lg" && "text-sm px-3 py-1"
      )}
      style={{ borderColor: `${color}35` }}
    >
      {tier.label[lang]}
    </span>
  )
}
