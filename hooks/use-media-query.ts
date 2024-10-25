import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    // Update initial state
    setMatches(media.matches);

    // Use addEventListener instead of addListener
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);

    // Clean up using removeEventListener
    return () => media.removeEventListener('change', listener);
  }, [query]); // Remove 'matches' from the dependency array

  return matches;
}
