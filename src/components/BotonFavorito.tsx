'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface Props {
  localId: string;
  className?: string;
}

export default function BotonFavorito({ localId, className = '' }: Props) {
  const { data: session, status } = useSession();
  const [favorito, setFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') checkFavorito();
    else if (status === 'unauthenticated') setCargando(false);
  }, [status, localId]);

  const checkFavorito = async () => {
    try {
      const res = await fetch('/api/favoritos');
      if (res.ok) {
        const data = await res.json();
        setFavorito(data.some((f: any) => f.localId === localId));
      }
    } catch (e) { }
    finally { setCargando(false); }
  };

  const toggle = async () => {
    if (status !== 'authenticated') return;
    setFavorito(!favorito);
    try {
      await fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId }),
      });
    } catch { setFavorito(favorito); }
  };

  if (cargando || !session) return null;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 transition-colors ${className} ${favorito ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
      title={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={favorito ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </button>
  );
}