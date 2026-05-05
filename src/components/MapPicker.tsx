'use client';

import { useEffect, useRef } from 'react';
import { loadGoogleMapsScript } from '@/lib/googleMaps';

const MAPS_API_KEY = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '') : '';

interface Props {
  latitud: string;
  longitud: string;
  onPositionChange: (lat: string, lng: string) => void;
}

export default function MapPicker({ latitud, longitud, onPositionChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !MAPS_API_KEY) return;

    loadGoogleMapsScript(() => {
      if (!window.google?.maps || !mapRef.current) return;

      const hasPos = latitud && longitud;
      const center = hasPos
        ? { lat: parseFloat(latitud), lng: parseFloat(longitud) }
        : { lat: -40.29531, lng: -73.08211 };

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: hasPos ? 15 : 13,
        clickableIcons: false,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      if (hasPos) {
        markerRef.current = new window.google.maps.Marker({
          position: center,
          map,
          draggable: true,
        });

        markerRef.current.addListener('dragend', () => {
          const pos = markerRef.current.getPosition();
          if (pos) onPositionChange(pos.lat().toString(), pos.lng().toString());
        });
      }

      map.addListener('click', (e: any) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng);
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: e.latLng,
            map,
            draggable: true,
          });
          markerRef.current.addListener('dragend', () => {
            const pos = markerRef.current.getPosition();
            if (pos) onPositionChange(pos.lat().toString(), pos.lng().toString());
          });
        }

        onPositionChange(lat.toString(), lng.toString());
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(mapInstanceRef.current);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  if (!MAPS_API_KEY) return null;

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] overflow-hidden"
    />
  );
}
