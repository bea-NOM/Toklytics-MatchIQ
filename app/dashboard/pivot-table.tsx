'use client'

import { useState } from 'react'
import type { PowerUpType } from '@prisma/client'

type PowerUp = {
  id: string
  type: PowerUpType
  expiry_at: Date | string
  holder_viewer_id: string
  holderName: string
  status: 'Active' | 'Expiring Soon' | 'Expires Today'
}

type GroupBy = 'type' | 'expiration' | 'supporter' | 'status'

type PivotTableProps = {
  powerups: PowerUp[]
  typeLabels: Record<string, string>
}

export default function PivotTable({ powerups, typeLabels }: PivotTableProps) {
  const [primaryGroup, setPrimaryGroup] = useState<GroupBy>('type')
  const [secondaryGroup, setSecondaryGroup] = useState<GroupBy>('expiration')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const groupOptions: { value: GroupBy; label: string }[] = [
    { value: 'type', label: 'Power-Up Type' },
    { value: 'expiration', label: 'Expiration Window' },
    { value: 'supporter', label: 'Supporter' },
    { value: 'status', label: 'Status' },
  ]

  const getGroupValue = (powerup: PowerUp, groupBy: GroupBy): string => {
    switch (groupBy) {
      case 'type':
        return typeLabels[powerup.type] || powerup.type
      case 'expiration': {
        const expiryMs = new Date(powerup.expiry_at).getTime()
        const now = Date.now()
        const diff = expiryMs - now
        const hours = diff / (1000 * 60 * 60)
        if (hours < 0) return 'Expired'
        if (hours < 24) return 'Next 24 Hours'
        if (hours < 72) return 'Next 72 Hours'
        if (hours < 168) return 'Next 7 Days'
        return '7+ Days'
      }
      case 'supporter':
        return powerup.holderName || powerup.holder_viewer_id
      case 'status':
        return powerup.status
    }
  }

  // Build hierarchical data structure
  const pivotData = new Map<string, Map<string, PowerUp[]>>()
  
  for (const powerup of powerups) {
    const primaryKey = getGroupValue(powerup, primaryGroup)
    const secondaryKey = getGroupValue(powerup, secondaryGroup)
    
    if (!pivotData.has(primaryKey)) {
      pivotData.set(primaryKey, new Map())
    }
    const secondaryMap = pivotData.get(primaryKey)!
    
    if (!secondaryMap.has(secondaryKey)) {
      secondaryMap.set(secondaryKey, [])
    }
    secondaryMap.get(secondaryKey)!.push(powerup)
  }

  // Sort primary keys
  const sortedPrimaryKeys = Array.from(pivotData.keys()).sort()

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedGroups(newExpanded)
  }

  const formatTime = (date: Date | string) => {
    const expiryMs = new Date(date).getTime()
    const now = Date.now()
    const diff = expiryMs - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diff < 0) return 'Expired'
    if (hours < 1) return `${mins}m`
    if (hours < 24) return `${hours}h ${mins}m`
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }

  return (
    <div style={{
      background: 'rgba(26, 31, 53, 0.6)',
      borderRadius: 20,
      border: '1px solid rgba(157, 124, 232, 0.3)',
      backdropFilter: 'blur(10px)',
      padding: 32,
      color: '#fff'
    }}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 32,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#9d7ce8' }}>
            Group By:
          </label>
          <select
            value={primaryGroup}
            onChange={(e) => setPrimaryGroup(e.target.value as GroupBy)}
            style={{
              padding: '8px 16px',
              background: 'rgba(157, 124, 232, 0.15)',
              border: '1px solid rgba(157, 124, 232, 0.3)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {groupOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#9d7ce8' }}>
            Then By:
          </label>
          <select
            value={secondaryGroup}
            onChange={(e) => setSecondaryGroup(e.target.value as GroupBy)}
            style={{
              padding: '8px 16px',
              background: 'rgba(157, 124, 232, 0.15)',
              border: '1px solid rgba(157, 124, 232, 0.3)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {groupOptions.filter(opt => opt.value !== primaryGroup).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
          Total: <strong style={{ color: '#9d7ce8' }}>{powerups.length}</strong> power-ups
        </div>
      </div>

      {/* Pivot Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedPrimaryKeys.map(primaryKey => {
          const secondaryMap = pivotData.get(primaryKey)!
          const totalCount = Array.from(secondaryMap.values()).reduce((sum, arr) => sum + arr.length, 0)
          const isExpanded = expandedGroups.has(primaryKey)
          const sortedSecondaryKeys = Array.from(secondaryMap.keys()).sort()

          return (
            <div key={primaryKey} style={{
              background: 'rgba(10, 14, 26, 0.5)',
              borderRadius: 12,
              border: '1px solid rgba(157, 124, 232, 0.2)',
              overflow: 'hidden'
            }}>
              {/* Primary Group Header */}
              <div
                onClick={() => toggleGroup(primaryKey)}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(157, 124, 232, 0.1)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, color: '#9d7ce8' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{primaryKey}</span>
                </div>
                <div style={{
                  padding: '4px 12px',
                  background: 'rgba(157, 124, 232, 0.25)',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#c4a9ff'
                }}>
                  {totalCount}
                </div>
              </div>

              {/* Secondary Groups */}
              {isExpanded && (
                <div style={{ padding: '0 20px 16px 52px' }}>
                  {sortedSecondaryKeys.map(secondaryKey => {
                    const items = secondaryMap.get(secondaryKey)!
                    return (
                      <div key={secondaryKey} style={{
                        padding: '12px 16px',
                        marginBottom: 8,
                        background: 'rgba(157, 124, 232, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(157, 124, 232, 0.15)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#c4a9ff' }}>
                            {secondaryKey}
                          </span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                            {items.length} item{items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Item details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {items.slice(0, 3).map(item => (
                            <div key={item.id} style={{
                              fontSize: 13,
                              color: 'rgba(255,255,255,0.8)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '4px 8px',
                              background: 'rgba(0,0,0,0.2)',
                              borderRadius: 4
                            }}>
                              <span>{item.holderName}</span>
                              <span style={{ color: '#9d7ce8', fontWeight: 600 }}>
                                {formatTime(item.expiry_at)}
                              </span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.5)',
                              fontStyle: 'italic',
                              paddingLeft: 8
                            }}>
                              +{items.length - 3} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
