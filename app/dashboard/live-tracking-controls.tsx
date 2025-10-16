'use client';

import { useState, useEffect } from 'react';

interface LiveTrackingStatus {
  isTracking: boolean;
  username?: string;
  roomId?: string;
}

export default function LiveTrackingControls() {
  const [status, setStatus] = useState<LiveTrackingStatus>({ isTracking: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiktokUsername, setTiktokUsername] = useState('');

  // Poll for status on mount and every 10 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/tiktok/live/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tiktok/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiktokUsername: tiktokUsername || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start tracking');
      }

      setStatus(data.status);
      setTiktokUsername('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tiktok/live/stop', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to stop tracking');
      }

      setStatus({ isTracking: false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 12,
      padding: 24,
      marginBottom: 32,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: status.isTracking ? '#4ade80' : '#94a3b8',
          boxShadow: status.isTracking ? '0 0 12px rgba(74, 222, 128, 0.6)' : 'none',
          animation: status.isTracking ? 'pulse 2s infinite' : 'none',
        }} />
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'white' }}>
          🎮 LIVE Power-Up Tracking
        </h2>
      </div>

      {status.isTracking ? (
        <div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{ color: 'white', marginBottom: 8 }}>
              <strong>📡 Tracking:</strong> @{status.username}
            </div>
            {status.roomId && (
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                Room ID: {status.roomId}
              </div>
            )}
            <div style={{ 
              color: '#4ade80', 
              fontSize: 14, 
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8 
            }}>
              <span style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: '#4ade80',
                animation: 'pulse 1.5s infinite'
              }} />
              Automatically capturing power-ups in real-time...
            </div>
          </div>

          <button
            onClick={handleStop}
            disabled={loading}
            style={{
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
            }}
          >
            {loading ? 'Stopping...' : '⏹ Stop Tracking'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: 16 }}>
            Start tracking your TikTok LIVE stream to automatically capture power-ups as they&apos;re given by your supporters.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              value={tiktokUsername}
              onChange={(e) => setTiktokUsername(e.target.value)}
              placeholder="TikTok username (optional)"
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 16,
                color: 'white',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
              }}
            />
            
            <button
              onClick={handleStart}
              disabled={loading}
              style={{
                background: 'rgba(52, 211, 153, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(52, 211, 153, 0.9)';
              }}
            >
              {loading ? 'Starting...' : '▶ Start Tracking'}
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: 12,
              color: '#fca5a5',
              fontSize: 14,
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
