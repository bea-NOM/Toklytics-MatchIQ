'use client';

import { useEffect, useMemo, useState } from 'react';

type CountdownTimerProps = {
  target: Date | string;
};

type CountdownState = {
  label: string;
  expired: boolean;
};

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;

function formatState(targetDate: Date): CountdownState {
  const now = Date.now();
  const diff = targetDate.getTime() - now;

  if (Number.isNaN(targetDate.getTime())) {
    return { label: '—', expired: false };
  }

  if (diff <= 0) {
    return { label: 'Expired', expired: true };
  }

  const hours = Math.floor(diff / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);
  const seconds = Math.floor((diff % MINUTE) / SECOND);

  const parts = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ];

  return { label: `${parts.join(':')}`, expired: false };
}

export default function CountdownTimer({ target }: CountdownTimerProps) {
  const targetDate = useMemo(
    () => (target instanceof Date ? target : new Date(target)),
    [target],
  );

  const [state, setState] = useState<CountdownState>(() => formatState(targetDate));

  useEffect(() => {
    setState(formatState(targetDate));
    const interval = window.setInterval(() => {
      setState(formatState(targetDate));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  const tone = state.expired ? '#FF5F5F' : '#0B5FFF';

  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
        color: tone,
      }}
    >
      {state.label}
    </span>
  );
}
