'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditarLocalModal from '@/components/EditarLocalModal';

interface Props {
  localId: string;
}

export default function BotonEditarLocal({ localId }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [esEditor, setEsEditor] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') fetchEstado();
    else if (status === 'unauthenticated') setCargando(false);
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
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[var(--card-bg)]/80 hover:bg-[var(--card-bg)] backdrop-blur-sm text-[var(--fg)] ring-1 ring-[var(--border-light)]"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Editar
      </button>
      {showModal && (
        <EditarLocalModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          localId={localId}
          onActualizar={() => router.refresh()}
        />
      )}
    </>
  );
}