"use client"

import { usePathname } from "next/navigation"
import { ChurchGPTWidget } from "@/components/churchgpt/ChurchGPTWidget"
import { GlobalAIAssistant } from "@/components/layout/GlobalAIAssistant"

export function ConditionalWidgets() {
  const pathname = usePathname()
  
  // Do not show widgets on use the main ChurchGPT page to avoid duplicates
  const isChurchGPTPage = pathname && (
    pathname.includes("churchgpt") || 
    pathname.includes("ChurchGPT")
  )

  if (isChurchGPTPage) {
    return null
  }

  return (
    <>
      <GlobalAIAssistant />
      <ChurchGPTWidget />
    </>
  )
}
