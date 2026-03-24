import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

interface LocationResult {
  postcode: string;
  address: string;
  city: string;
}

interface UseLocationReturn {
  isLocating: boolean;
  getCurrentLocation: () => Promise<LocationResult | null>;
}

// Web: use browser geolocation + Nominatim reverse geocoding
async function getWebLocation(): Promise<LocationResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'User-Agent': 'FreshLocal/1.0' } }
          );
          const data = await response.json();
          const addr = data.address || {};
          const postcode = addr.postcode || '';
          const road = addr.road || addr.pedestrian || '';
          const city = addr.city || addr.town || addr.village || '';
          const address = [road, city].filter(Boolean).join(', ');
          resolve({ postcode, address, city });
        } catch {
          alert('Could not determine your address. Please enter it manually.');
          resolve(null);
        }
      },
      () => {
        alert('Could not get your location. Please enable location access or enter your postcode manually.');
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}

// Native: use expo-location
async function getNativeLocation(): Promise<LocationResult | null> {
  const Location = require('expo-location');

  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Location Permission',
      'Please enable location access in your device settings to use this feature.',
      [{ text: 'OK' }]
    );
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const [geocode] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  if (!geocode) {
    Alert.alert('Error', 'Could not determine your address. Please enter it manually.');
    return null;
  }

  const postcode = geocode.postalCode || '';
  const street = geocode.street || geocode.name || '';
  const city = geocode.city || geocode.subregion || '';
  const address = [street, city].filter(Boolean).join(', ');

  return { postcode, address, city };
}

export function useLocation(): UseLocationReturn {
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = useCallback(async (): Promise<LocationResult | null> => {
    setIsLocating(true);
    try {
      if (Platform.OS === 'web') {
        return await getWebLocation();
      }
      return await getNativeLocation();
    } catch {
      if (Platform.OS === 'web') {
        alert('Could not get your current location. Please try again or enter your postcode manually.');
      } else {
        Alert.alert(
          'Location Error',
          'Could not get your current location. Please try again or enter your postcode manually.'
        );
      }
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return { isLocating, getCurrentLocation };
}

export default useLocation;
