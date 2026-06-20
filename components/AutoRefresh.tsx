"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function AutoRefresh() {
  const refreshData = useAppStore((s) => s.refreshData)

  useEffect(() => {
    const id = setInterval(() => {
      refreshData()
    }, 30000)
    return () => clearInterval(id)
  }, [refreshData])

  return null
}
