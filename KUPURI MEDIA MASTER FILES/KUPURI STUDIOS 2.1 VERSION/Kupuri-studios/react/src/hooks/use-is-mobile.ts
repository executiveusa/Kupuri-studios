import { useState, useEffect } from 'react'

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint - The max-width breakpoint in pixels (default: 768)
 * @returns boolean indicating if viewport is mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
    
    // Set initial value
    setIsMobile(mediaQuery.matches)

    // Create event listener
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Add listener (modern browsers)
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [breakpoint])

  return isMobile
}
