import { useState, useEffect, useRef, useCallback } from 'react';

// Client-side game clock. While the game runs, animates hh:mm smoothly from
// elapsed real time (server ticks are coarser); while paused, mirrors server
// time exactly. Returns { displayTime, resetClock } — call resetClock on
// game reset so the animation restarts from Monday 09:00.
export function useGameClock(gameState, config) {
  const [displayTime, setDisplayTime] = useState({ hour: 9, minute: 0, dayIndex: 0 });
  const clockAnimationRef = useRef(null);
  const clockStartRef = useRef({ hour: 9, day: 1, realStartTime: Date.now(), synced: false });
  const wasPausedRef = useRef(true);

  // Store current pause state in ref so animation can read fresh value
  const isPausedRef = useRef(true);
  const configRef = useRef({ tickSpeed: 333, hoursPerTick: 4 });
  const gameStateRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    if (gameState) {
      isPausedRef.current = gameState.isPausedForWeeklyDecision || gameState.isGameOver;
      gameStateRef.current = gameState;
    }
  }, [gameState]);

  useEffect(() => {
    if (config) {
      configRef.current = {
        tickSpeed: config.tickSpeed || 333,
        hoursPerTick: config.hoursPerTick || 4
      };
    }
  }, [config]);

  // Handle pause/unpause transitions
  useEffect(() => {
    if (!gameState) return;

    const isPaused = gameState.isPausedForWeeklyDecision || gameState.isGameOver;

    // Detect pause/unpause transitions
    if (isPaused && !wasPausedRef.current) {
      // Just paused - sync display to server time
      wasPausedRef.current = true;
      clockStartRef.current.synced = false;
    } else if (!isPaused && wasPausedRef.current) {
      // Just unpaused - capture starting point for animation
      wasPausedRef.current = false;
      clockStartRef.current = {
        hour: gameState.hour,
        day: gameState.day,
        realStartTime: Date.now(),
        synced: true
      };
    }

    // Initial sync if not yet synced
    if (!clockStartRef.current.synced && gameState.hour !== undefined) {
      clockStartRef.current = {
        hour: gameState.hour,
        day: gameState.day,
        realStartTime: Date.now(),
        synced: true
      };
    }
  }, [gameState]);

  // Continuous clock animation - runs purely client-side
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const { tickSpeed, hoursPerTick } = configRef.current;
      const gameMinutesPerMs = (hoursPerTick * 60) / tickSpeed;

      if (isPausedRef.current) {
        // When paused, show server time exactly
        const gs = gameStateRef.current;
        const serverHour = gs?.hour ?? 9;
        const serverDay = gs?.day ?? 1;
        setDisplayTime({ hour: serverHour, minute: 0, dayIndex: serverDay - 1 });
      } else {
        // Calculate time based purely on elapsed real time since unpause
        const elapsedMs = now - clockStartRef.current.realStartTime;
        const elapsedGameMinutes = elapsedMs * gameMinutesPerMs;
        const startMinutes = clockStartRef.current.hour * 60;
        const totalMinutes = startMinutes + elapsedGameMinutes;

        // Calculate hours and days crossed
        const totalHours = totalMinutes / 60;
        const daysCrossed = Math.floor(totalHours / 24);

        const hour = Math.floor(totalHours) % 24;
        const minute = Math.floor(totalMinutes % 60);
        const dayIndex = ((clockStartRef.current.day - 1) + daysCrossed) % 7;

        setDisplayTime({ hour, minute, dayIndex });
      }

      clockAnimationRef.current = requestAnimationFrame(animate);
    };

    clockAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (clockAnimationRef.current) {
        cancelAnimationFrame(clockAnimationRef.current);
      }
    };
  }, []);

  const resetClock = useCallback(() => {
    clockStartRef.current = { hour: 9, day: 1, realStartTime: Date.now(), synced: false };
    wasPausedRef.current = true;
  }, []);

  return { displayTime, resetClock };
}
