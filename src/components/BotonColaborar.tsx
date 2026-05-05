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
    try { const r = await fetch(`/api/colaboradores/estado?localId=${localId}`); setEstado((await r.json()).estado); } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const solicitarColaboracion = async () => {
    setSolicitando(true);
    try {
      const res = await fetch('/api/colaboradores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ localId }) });
      const data = await res.json();
      if (res.ok) { setEstado('pendiente'); mostrarToast('Solicitud enviada', 'success'); }
      else { if (data.error.includes('bloqueado')) setEstado('bloqueado'); if (data.error.includes('Ya eres')) setEstado('pendiente'); if (!data.error.includes('owner')) mostrarToast(data.error, 'error'); }
    } catch (e) { console.error(e); } finally { setSolicitando(false); }
  };

  if (status === 'loading' || cargando) {
    return <button disabled className="w-full bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-medium">Cargando...</button>;
  }

  if (!session) {
    return <a href="/auth" className="block w-full bg-gray-900 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">Iniciar sesión para colaborar</a>;
  }

  if (estado === 'owner' || estado === 'bloqueado') return null;

  if (estado === 'colaborador') {
    return <a href={`/dashboard/editar/${localId}`} className="block w-full bg-gray-900 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">💡 Sugerir Cambio</a>;
  }

  if (estado === 'pendiente') {
    return <button disabled className="w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-medium">⏳ Solicitud pendiente</button>;
  }

  return (
    <button onClick={solicitarColaboracion} disabled={solicitando}
      className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
      {solicitando ? 'Enviando...' : '🤝 Solicitar colaboración'}
    </button>
  );
}