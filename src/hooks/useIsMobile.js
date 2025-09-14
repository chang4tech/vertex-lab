export function useIsMobile() {
  if (typeof window === 'undefined') return false;
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isNarrow = window.innerWidth <= 768;
  return isCoarse || isNarrow;
}

