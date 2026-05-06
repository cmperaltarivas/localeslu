'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadGoogleMapsScript } from '@/lib/googleMaps';

interface MarkerData {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  categorias: string;
}

export default function MapaPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/locales')
      .then(r => r.json())
      .then(data => {
        const withCoords = data.filter((l: any) => l.latitud && l.longitud);
        setMarkers(withCoords);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mapRef.current || markers.length === 0 || loading) return;

    loadGoogleMapsScript(() => {
      if (!window.google?.maps || !mapRef.current) return;

      const center = markers.reduce(
        (acc, m) => ({ lat: acc.lat + m.latitud / markers.length, lng: acc.lng + m.longitud / markers.length }),
        { lat: 0, lng: 0 }
      );

      const map = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom: 13,
        clickableIcons: false,
      });

      markers.forEach(m => {
        const marker = new window.google.maps.Marker({
          position: { lat: m.latitud, lng: m.longitud },
          map,
          title: m.nombre,
        });

        const cats = JSON.parse(m.categorias || '[]').join(', ');
        const info = new window.google.maps.InfoWindow({
          content: `<div style="padding:4px 0"><a href="/local/${m.id}" style="font-weight:600;font-size:14px;color:#2563eb;text-decoration:none">${m.nombre}</a><p style="margin:4px 0 0;font-size:12px;color:#666">${cats}</p></div>`,
        });

        marker.addListener('click', () => info.open(map, marker));
      });
    });
  }, [markers, loading]);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--fg)]">Mapa de locales</h1>
            <p className="text-sm text-[var(--fg-muted)]">{markers.length} locales con ubicación</p>
          </div>
          <Link href="/buscar" className="text-[var(--primary)] text-sm font-medium hover:underline">← Buscar</Link>
        </div>

        {loading ? (
          <div className="h-[60vh] rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
            <span className="animate-pulse text-[var(--fg-muted)]">Cargando mapa...</span>
          </div>
        ) : markers.length === 0 ? (
          <div className="h-[60vh] rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center text-center">
            <div>
              <p className="text-[var(--fg-muted)] mb-2">No hay locales con ubicación</p>
              <Link href="/dashboard?nuevo=true" className="text-[var(--primary)] text-sm hover:underline">Agregar local</Link>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="h-[65vh] rounded-2xl border border-[var(--border)]" />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {markers.slice(0, 6).map(m => (
            <Link key={m.id} href={`/local/${m.id}`}
              className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
            >
              <p className="text-sm font-medium text-[var(--fg)]">{m.nombre}</p>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">{JSON.parse(m.categorias || '[]').join(', ')}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}