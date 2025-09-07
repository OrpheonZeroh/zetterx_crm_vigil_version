'use client'

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  variant?: 'header' | 'full'
  size?: 'sm' | 'md' | 'lg'
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  variant = 'header',
  size = 'md' 
}) => {
  // Size configurations for the logo image (horizontal layout)
  const sizeConfig = {
    sm: { width: 80, height: 20 },
    md: { width: 120, height: 30 },
    lg: { width: 160, height: 40 }
  }
  
  const { width, height } = sizeConfig[size]

  if (variant === 'header') {
    // Simplified header version - just the image
    return (
      <div className={`flex items-center ${className}`}>
        <Image
          src="/sin_fondoBgColor.png"
          alt="ZetterX"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    )
  }

  // Full version for login/register pages
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <Image
        src="/sin_fondoBgColor.png"
        alt="ZetterX"
        width={width * 1.5}
        height={height * 1.5}
        className="object-contain"
        priority
      />
    </div>
  )
}
