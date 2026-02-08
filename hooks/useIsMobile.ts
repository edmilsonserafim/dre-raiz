import { useState, useEffect } from 'react';

interface BreakpointInfo {
  isMobile: boolean;   // < 640px
  isTablet: boolean;   // 640px – 1023px
  isDesktop: boolean;  // >= 1024px
}

export function useIsMobile(): BreakpointInfo {
  const [breakpoint, setBreakpoint] = useState<BreakpointInfo>(() => {
    if (typeof window === 'undefined') return { isMobile: false, isTablet: false, isDesktop: true };
    const w = window.innerWidth;
    return {
      isMobile: w < 640,
      isTablet: w >= 640 && w < 1024,
      isDesktop: w >= 1024
    };
  });

  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 639px)');
    const mqTablet = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');
    const mqDesktop = window.matchMedia('(min-width: 1024px)');

    const update = () => {
      setBreakpoint({
        isMobile: mqMobile.matches,
        isTablet: mqTablet.matches,
        isDesktop: mqDesktop.matches
      });
    };

    mqMobile.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    mqDesktop.addEventListener('change', update);

    return () => {
      mqMobile.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
      mqDesktop.removeEventListener('change', update);
    };
  }, []);

  return breakpoint;
}
