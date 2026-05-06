'use client';

import { useState } from 'react';

interface Props {
  nombre: string;
}

export default function BotonCompartir({ nombre }: Props) {
  const [copiado, setCopiado] = useState(false);

  const compartir = async () => {
    const url = window.location.href;
    const texto = `${nombre} - Locales La Unión\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: nombre, text: texto, url });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  return (
    <button
      onClick={compartir}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-full text-sm text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 transition-colors"
    >
      {copiado ? '✓ Copiado' : '↗ Compartir'}
    </button>
  );
}