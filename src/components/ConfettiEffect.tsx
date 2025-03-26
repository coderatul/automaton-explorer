
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ 
  active, 
  duration = 3000 
}) => {
  const { width, height } = useWindowSize();
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (active) {
      setIsRunning(true);
      const timer = setTimeout(() => {
        setIsRunning(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [active, duration]);
  
  if (!isRunning) return null;
  
  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
      colors={['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6']}
    />
  );
};
