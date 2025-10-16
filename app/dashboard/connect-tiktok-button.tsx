'use client'

import { useState } from 'react'

export default function ConnectTikTokButton() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <a
      href="/api/tiktok/auth/start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '12px 24px',
        borderRadius: 12,
        background: '#0a0a0a',
        color: '#fff',
        fontWeight: 600,
        fontSize: 15,
        textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'inline-block',
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      Connect TikTok
    </a>
  )
}
