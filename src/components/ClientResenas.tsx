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
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Reseñas</h3>
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Reseñas</h3>

      {resenas.length === 0 ? (
        <p className="text-gray-500 mb-6">Aún no hay reseñas</p>
      ) : (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-500 text-xl">★</span>
            <span className="font-bold text-lg">{promedio.toFixed(1)}/5</span>
            <span className="text-sm text-gray-500">({resenas.length} reseñas)</span>
          </div>
          {resenas.map((resena) => (
            <div key={resena.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">★</span>
                <span className="font-bold">{resena.calificacion}/5</span>
                <span className="text-sm text-gray-500">
                  {resena.user.nombre}
                </span>
              </div>
              {resena.comentario && (
                <p className="text-gray-600 mt-2">{resena.comentario}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {session?.user ? (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4 mt-4">
          <p className="font-medium text-gray-900 mb-3">Deja tu reseña</p>

          {mensaje && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Calificación</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((estrella) => (
                <button
                  key={estrella}
                  type="button"
                  onClick={() => setCalificacion(estrella)}
                  className={`text-2xl transition ${
                    estrella <= calificacion ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Comentario (opcional)</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none"
              rows={3}
              placeholder="Escribe tu experiencia..."
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {enviando ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </form>
      ) : (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-gray-600 mb-2">Inicia sesión para dejar una reseña</p>
          <button
            onClick={() => signIn('google')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Iniciar sesión con Google
          </button>
        </div>
      )}
    </div>
  );
}