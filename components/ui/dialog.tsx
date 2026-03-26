'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) {
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={cn(
        'rounded-2xl p-0 border-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm w-full max-w-md',
        className
      )}
      onClose={onClose}
    >
      <div className="p-6">
        {title && <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>}
        {children}
      </div>
    </dialog>
  )
}
