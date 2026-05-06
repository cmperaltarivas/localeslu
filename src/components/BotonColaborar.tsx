'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { mostrarToast } from '@/components/Toast';

interface Props { localId: string; ownerId: string; }

export default function BotonColaborar({ localId, ownerId }: Props) {
  const { data: session, status } = useSession();
  const [solicitando, setSolicitando] = useState(false);
  const [estado, setEstado] = useState<string>('none');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') fetchEstado();
    else if (status === 'unauthenticated') setCargando(false);
  }, [status]);

  const fetchEstado = async () => {
    try { const r = await fetch(`/api/colaboradores/estado?localId=${localId}`); setEstado((await r.json()).estado); } catch { } finally { setCargando(false); }
  };

  const solicitarColaboracion = async () => {
    setSolicitando(true);
    try {
      const res = await fetch('/api/colaboradores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ localId }) });
      const data = await res.json();
      if (res.ok) { setEstado('pendiente'); mostrarToast('Solicitud enviada', 'success'); }
      else { if (data.error.includes('bloqueado')) setEstado('bloqueado'); if (data.error.includes('Ya eres')) setEstado('pendiente'); if (!data.error.includes('owner')) mostrarToast(data.error, 'error'); }
    } catch { } finally { setSolicitando(false); }
  };

  if (status === 'loading' || cargando) {
    return <button disabled className="w-full bg-[var(--bg-alt)] text-[var(--fg-muted)] px-6 py-3 rounded-xl font-medium text-sm">Cargando...</button>;
  }

  if (!session) {
    return <a href="/auth" className="block w-full btn-primary text-center">Iniciar sesión para colaborar</a>;
  }

  if (estado === 'owner' || estado === 'bloqueado') return null;

  if (estado === 'colaborador') {
    return <a href={`/dashboard/editar/${localId}`} className="block w-full btn-primary text-center">
      <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
      Sugerir Cambio
    </a>;
  }

  if (estado === 'pendiente') {
    return <button disabled className="w-full bg-[var(--bg-alt)] text-[var(--fg-muted)] px-6 py-3 rounded-xl font-medium text-sm">
      <svg className="w-4 h-4 inline mr-1.5 -mt-0.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Solicitud pendiente
    </button>;
  }

  return (
    <button onClick={solicitarColaboracion} disabled={solicitando}
      className="w-full btn-primary">
      {solicitando ? <span className="spinner" /> : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Solicitar colaboración
        </>
      )}
    </button>
  );
}