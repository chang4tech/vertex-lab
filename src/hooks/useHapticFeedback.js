import { useCallback, useRef } from 'react';

/**
 * Hook for triggering haptic feedback on supported devices
 * Uses Vibration API with fallback for unsupported browsers
 */
export function useHapticFeedback() {
  const lastFeedbackTime = useRef(0);

  const triggerHaptic = useCallback((type = 'light') => {
    // Throttle to avoid excessive vibrations (minimum 50ms between triggers)
    const now = Date.now();
    if (now - lastFeedbackTime.current < 50) return;
    lastFeedbackTime.current = now;

    // Check if Vibration API is supported
    if (!navigator.vibrate) return;

    // Map feedback types to vibration patterns
    const patterns = {
      light: 10,    // Quick tap
      medium: 20,   // Standard tap
      heavy: 30,    // Strong tap
      success: [10, 50, 10],  // Double tap
      error: [20, 100, 20, 100, 20],  // Triple tap
      selection: 15, // Selection feedback
    };

    const pattern = patterns[type] || patterns.light;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if vibration is blocked
      console.debug('[Haptic] Vibration failed:', error);
    }
  }, []);

  const triggerWithAnimation = useCallback((element, type = 'light') => {
    triggerHaptic(type);

    // Add visual feedback animation
    if (element && element.classList) {
      element.classList.add('plugin-haptic-feedback');
      setTimeout(() => {
        element.classList.remove('plugin-haptic-feedback');
      }, 150);
    }
  }, [triggerHaptic]);

  return { triggerHaptic, triggerWithAnimation };
}

export default useHapticFeedback;
