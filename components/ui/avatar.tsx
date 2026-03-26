'use client'

import { cn, getInitials } from '@/lib/utils'
import { useState } from 'react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const pxMap = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = pxMap[size]
  const showImage = src && !imgError

  return (
    <div
      className={cn(
        'rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground overflow-hidden shrink-0',
        sizeMap[size],
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  )
}
