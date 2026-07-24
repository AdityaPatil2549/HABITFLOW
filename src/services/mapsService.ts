/**
 * Google Maps Service
 * Uses the Google Maps JavaScript API + Geocoding API for location-based habit triggers.
 * Requires VITE_MAPS_API_KEY in .env.local
 */

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY || '';
const GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationTrigger {
  address: string;
  coordinates: Coordinates;
  radius: number; // meters
}

class MapsService {
  private mapsLoaded = false;

  /** Dynamically load the Google Maps JS SDK */
  async loadSDK(): Promise<void> {
    if (this.mapsLoaded || !MAPS_API_KEY) return;
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-sdk')) {
        this.mapsLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => { this.mapsLoaded = true; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  isConfigured(): boolean {
    return !!MAPS_API_KEY;
  }

  /**
   * Get the user's current GPS coordinates via browser Geolocation API.
   */
  getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(`Location error: ${err.message}`)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  /**
   * Convert a human-readable address to coordinates using the Geocoding API.
   */
  async geocodeAddress(address: string): Promise<Coordinates> {
    if (!MAPS_API_KEY) throw new Error('Maps API key not configured');
    const url = `${GEOCODING_BASE}?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results[0]) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
    return data.results[0].geometry.location;
  }

  /**
   * Reverse geocode coordinates to a human-readable address.
   */
  async reverseGeocode(coords: Coordinates): Promise<string> {
    if (!MAPS_API_KEY) return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    const url = `${GEOCODING_BASE}?latlng=${coords.lat},${coords.lng}&key=${MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results[0]) return 'Unknown location';
    return data.results[0].formatted_address;
  }

  /**
   * Check if the user is within a given radius of a target location.
   */
  isWithinRadius(current: Coordinates, target: Coordinates, radiusMeters: number): boolean {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (current.lat * Math.PI) / 180;
    const φ2 = (target.lat * Math.PI) / 180;
    const Δφ = ((target.lat - current.lat) * Math.PI) / 180;
    const Δλ = ((target.lng - current.lng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d <= radiusMeters;
  }
}

export const mapsService = new MapsService();
