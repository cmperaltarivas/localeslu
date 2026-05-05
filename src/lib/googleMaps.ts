declare global {
  interface Window {
    google?: any;
    __googleMapsLoaded?: () => void;
    __googleMapsCallback?: () => void;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const loadGoogleMapsScript = (callback: () => void): void => {
  if (!API_KEY || API_KEY === 'AIzaSyDemoKeyReplaceWithReal') {
    console.warn('Configure tu Google Maps API key en .env');
    return;
  }

  if (window.google?.maps) {
    callback();
  } else {
    window.__googleMapsCallback = callback;
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geocoding&callback=__googleMapsLoaded`;
      script.async = true;
      script.defer = true;
      window.__googleMapsLoaded = () => {
        if (window.__googleMapsCallback) {
          window.__googleMapsCallback();
        }
      };
      document.head.appendChild(script);
    } else if (window.__googleMapsCallback) {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          window.__googleMapsCallback?.();
        }
      }, 100);
    }
  }
};