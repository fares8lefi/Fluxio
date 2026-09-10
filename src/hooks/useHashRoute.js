import { useEffect, useState } from 'react';

export function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || '#accueil');
  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash || '#accueil');
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);
  return route;
}
