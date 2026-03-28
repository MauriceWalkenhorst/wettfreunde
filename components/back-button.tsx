'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  label: string
}

export function BackButton({ label }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      ← {label}
    </button>
  )
}
