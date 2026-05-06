'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

interface Resena {
  id: string;
  calificacion: number;
  comentario: string | null;
  createdAt: string | Date;
  user: {
    nombre: string;
  };
}

interface Props {
  localId: string;
  resenasIniciales: Resena[];
}

export default function ClientResenas({ localId, resenasIniciales }: Props) {
  const { data: session, status } = useSession();
  const [resenas, setResenas] = useState<any[]>(resenasIniciales);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setResenas(resenasIniciales);
  }, [resenasIniciales]);

  const promedio = resenas.length > 0
    ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    setMensaje('');

    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId, calificacion, comentario }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al enviar');
        return;
      }

      setMensaje(data.message);
      setComentario('');
      setCalificacion(5);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border-light)]">
        <h3 className="font-bold text-[var(--fg)] mb-4">Reseñas</h3>
        <p className="text-[var(--fg-muted)]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border-light)]">
      <h3 className="font-bold text-[var(--fg)] mb-4">Reseñas</h3>

      {resenas.length === 0 ? (
        <p className="text-[var(--fg-muted)] mb-6">Aún no hay reseñas. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--border-light)]">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="font-bold text-lg text-[var(--fg)]">{promedio.toFixed(1)}</span>
            <span className="text-sm text-[var(--fg-muted)]">· {resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'}</span>
          </div>
          {resenas.map((resena) => (
            <div key={resena.id} className="border-b border-[var(--border-light)] pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-3.5 h-3.5 ${s <= resena.calificacion ? 'text-amber-400' : 'text-[var(--border)]'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-[var(--fg)]">{resena.calificacion}/5</span>
                <span className="text-sm text-[var(--fg-muted)]">
                  · {resena.user.nombre}
                </span>
              </div>
              {resena.comentario && (
                <p className="text-[var(--fg-muted)] mt-2 text-sm leading-relaxed">{resena.comentario}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {session?.user ? (
        <form onSubmit={handleSubmit} className="border-t border-[var(--border-light)] pt-5 mt-4">
          <p className="font-medium text-[var(--fg)] mb-4">Deja tu reseña</p>

          {mensaje && (
            <div className="bg-[var(--primary)]/8 text-[var(--primary)] p-3 rounded-lg mb-4 text-sm">{mensaje}</div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-[var(--fg-muted)] mb-2">Calificación</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((estrella) => (
                <button
                  key={estrella}
                  type="button"
                  onClick={() => setCalificacion(estrella)}
                  className={`text-2xl transition hover:scale-110 ${
                    estrella <= calificacion ? 'text-amber-400' : 'text-[var(--border)]'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-[var(--fg-muted)] mb-2">Comentario (opcional)</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-3 border border-[var(--border)] rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all bg-[var(--card-bg)]"
              rows={3}
              placeholder="Comparte tu experiencia..."
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="btn-primary !w-full"
          >
            {enviando ? <span className="spinner" /> : 'Enviar reseña'}
          </button>
        </form>
      ) : (
        <div className="border-t border-[var(--border-light)] pt-5 mt-4">
          <p className="text-[var(--fg-muted)] mb-3">Inicia sesión para dejar una reseña</p>
          <button
            onClick={() => signIn('google')}
            className="btn-primary !w-full"
          >
            Iniciar sesión con Google
          </button>
        </div>
      )}
    </div>
  );
}