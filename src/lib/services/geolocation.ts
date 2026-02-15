/**
 * Geolocation service for detecting user's current location
 * Falls back to Lagos default if permission denied or unavailable
 */

const LAGOS_DEFAULT = { lat: 6.5244, lng: 3.3792 };

export interface GeolocationResult {
  lat: number;
  lng: number;
}

/**
 * Request user's current location via Geolocation API
 * @returns Promise<GeolocationResult> - User location or Lagos fallback
 */
export async function getUserLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using default location');
      resolve(LAGOS_DEFAULT);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(
          `User location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.warn(`Geolocation error: ${error.message}, using default location`);
        resolve(LAGOS_DEFAULT);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}
