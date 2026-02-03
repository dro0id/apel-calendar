"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface CopyLinkButtonProps {
  link: string
}

export function CopyLinkButton({ link }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={handleCopy} size="sm">
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copié !
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copier
        </>
      )}
    </Button>
  )
}
