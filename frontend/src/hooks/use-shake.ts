import { useEffect, useRef } from 'react';

const SHAKE_THRESHOLD = 25;
const SHAKE_COUNT_THRESHOLD = 3;
const SHAKE_TIMEOUT = 800; // ms window to accumulate shakes

export function useShake(onShake: () => void) {
  const shakeCount = useRef(0);
  const lastShake = useRef(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const hasReported = useRef(false);

  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel || accel.x == null || accel.y == null || accel.z == null) return;

      const dx = Math.abs(accel.x - lastAccel.current.x);
      const dy = Math.abs(accel.y - lastAccel.current.y);
      const dz = Math.abs(accel.z - lastAccel.current.z);

      lastAccel.current = { x: accel.x, y: accel.y, z: accel.z };

      if (dx + dy + dz > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShake.current > SHAKE_TIMEOUT) {
          shakeCount.current = 0;
          hasReported.current = false;
        }
        shakeCount.current++;
        lastShake.current = now;

        if (shakeCount.current >= SHAKE_COUNT_THRESHOLD && !hasReported.current) {
          hasReported.current = true;
          onShake();
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onShake]);
}
