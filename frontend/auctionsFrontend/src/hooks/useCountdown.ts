import { useState, useEffect, useCallback } from 'react';
import { differenceInMilliseconds, isPast } from 'date-fns';

export type UrgencyLevel = 'normal' | 'soon' | 'critical';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  urgency: UrgencyLevel;
}

export function useCountdown(endAt: string | null): CountdownResult {
  // Real implementation would sync with /api/v1/time
  // For this design, we'll assume the client clock is relatively close and compute offset if needed.
  // We skip actual server sync since the endpoint isn't implemented, but use standard diff logic.

  const [timeLeft, setTimeLeft] = useState<number>(0);

  const calculateTimeLeft = useCallback(() => {
    if (!endAt) return 0;
    const endDate = new Date(endAt);
    const now = new Date(); // Ideally serverTime() + performance.now() elapsed
    return Math.max(0, differenceInMilliseconds(endDate, now));
  }, [endAt]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const isExpired = !endAt || isPast(new Date(endAt)) || timeLeft <= 0;

  // Compute standard time units
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  // Determine urgency for UI
  let urgency: UrgencyLevel = 'normal';
  if (timeLeft > 0 && timeLeft <= 5 * 60 * 1000) {
    urgency = 'critical'; // < 5 mins
  } else if (timeLeft > 0 && timeLeft <= 60 * 60 * 1000) {
    urgency = 'soon'; // < 1 hr
  }

  return { days, hours, minutes, seconds, isExpired, urgency };
}
