import { useState, useEffect, useRef } from 'react';

interface UseExamTimerProps {
  startedAt?: string;
  durationMinutes: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export function useExamTimer({ startedAt, durationMinutes, onTimeUp, isActive }: UseExamTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!startedAt) return durationMinutes * 60;
    const startTime = new Date(startedAt).getTime();
    const totalDurationMs = durationMinutes * 60 * 1000;
    const elapsedMs = Math.max(0, Date.now() - startTime);
    const remainingMs = Math.max(0, totalDurationMs - elapsedMs);
    return Math.floor(remainingMs / 1000);
  });

  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isActive || !startedAt) return;

    const calculateRemaining = () => {
      const startTime = new Date(startedAt).getTime();
      const totalDurationMs = durationMinutes * 60 * 1000;
      const elapsedMs = Math.max(0, Date.now() - startTime);
      const remaining = Math.max(0, Math.floor((totalDurationMs - elapsedMs) / 1000));
      return remaining;
    };

    // Immediate initial sync
    const initial = calculateRemaining();
    setSecondsLeft(initial);

    if (initial <= 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onTimeUpRef.current();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onTimeUpRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, isActive]);

  // Formatter
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = durationMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  // Determine state
  const isDanger = secondsLeft <= 300; // <= 5 min
  const isWarning = secondsLeft <= 600 && !isDanger; // <= 10 min
  const isCritical = secondsLeft <= 60; // <= 1 min

  return {
    secondsLeft,
    formattedTime,
    progressPercent,
    isWarning,
    isDanger,
    isCritical,
    isTimeUp: secondsLeft <= 0,
  };
}
