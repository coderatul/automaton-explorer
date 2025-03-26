
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

// Default size for SSR or when window is not available
const defaultSize: WindowSize = {
  width: 1200,
  height: 800,
};

export function useWindowSize(): WindowSize {
  // Initialize with undefined to handle SSR
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    // Return default size for SSR
    return defaultSize;
  });

  useEffect(() => {
    // Skip effect during SSR
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
