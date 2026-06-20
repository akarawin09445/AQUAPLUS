"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function ThemeSync() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    if (theme === "dark") {
      html.classList.add("dark")
      html.classList.remove("light")
    } else {
      html.classList.add("light")
      html.classList.remove("dark")
    }
  }, [theme])

  return null
}
