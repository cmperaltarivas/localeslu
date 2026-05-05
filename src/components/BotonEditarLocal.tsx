'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  localId: string;
}

export default function BotonEditarLocal({ localId }: Props) {
  const { data: session, status } = useSession();
  const [esEditor, setEsEditor] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEstado();
    } else if (status === 'unauthenticated') {
      setCargando(false);
    }
  }, [status]);

  const fetchEstado = async () => {
    try {
      const res = await fetch(`/api/colaboradores/estado?localId=${localId}`);
      const data = await res.json();
      setEsEditor(data.estado === 'owner');
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  if (cargando || !esEditor) return null;

  return (
    <Link
      href={`/dashboard/editar/${localId}`}
      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg text-xs font-medium hover:bg-white/20 transition-colors"
    >
      ✏️ Editar
    </Link>
  );
}