'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { mostrarToast } from '@/components/Toast';

interface Resena {
  id: string;
  calificacion: number;
  comentario: string | null;
  aprobado: boolean;
  createdAt: string;
  user: {
    nombre: string;
    email: string;
  };
  local: {
    nombre: string;
    id: string;
  };
}

export default function AdminResenasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState<string | null>(null);
  
const verificadasFromUrl = searchParams.get('tab') === 'publicadas';
  const [verificadas, setVerificadas] = useState(verificadasFromUrl);
  const [contadorPendientes, setContadorPendientes] = useState(0);
  const [contadorPublicadas, setContadorPublicadas] = useState(0);
  const localIdFromUrl = searchParams.get('local');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user?.email !== 'cmperaltarivas@gmail.com') {
      router.push('/');
      return;
    }
    if (status !== 'authenticated') return;
    
    cargarDatos();
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      cargarDatos();
    }
  }, [searchParams]);

  const cargarDatos = async () => {
    setCargando(true);
    const localFilter = searchParams.get('local');
    try {
      const [resP, resPub] = await Promise.all([
        fetch('/api/resenas/admin?pendientes=true', { cache: 'no-store' }),
        fetch('/api/resenas/admin?todas=true', { cache: 'no-store' })
      ]);
      
      let dataP = resP.ok ? await resP.json() : [];
      let dataPub = resPub.ok ? await resPub.json() : [];
      
      if (localFilter) {
        dataP = dataP.filter((r: any) => r.local.id === localFilter);
        dataPub = dataPub.filter((r: any) => r.local.id === localFilter);
      }
      
      setContadorPendientes(dataP.length);
      setContadorPublicadas(dataPub.length);
      
      const currentTab = searchParams.get('tab');
      const isPublicadas = currentTab === 'publicadas';
      setVerificadas(isPublicadas);
      setResenas(isPublicadas ? dataPub : dataP);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarPestana = async (publicadas: boolean) => {
    const baseUrl = localIdFromUrl ? `/admin/resenas?local=${localIdFromUrl}&` : '/admin/resenas?';
    router.push(baseUrl + `tab=${publicadas ? 'publicadas' : 'pendientes'}`, { scroll: false });
    setCargando(true);
    try {
      const url = publicadas 
        ? '/api/resenas/admin?todas=true' 
        : '/api/resenas/admin?pendientes=true';
      const res = await fetch(url);
      let data = res.ok ? await res.json() : [];
      
      if (localIdFromUrl) {
        data = data.filter((r: any) => r.local.id === localIdFromUrl);
      }
      
      setResenas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const resenasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return resenas;
    const buscar = busqueda.toLowerCase();
    return resenas.filter(r => 
      r.local.nombre.toLowerCase().includes(buscar) ||
      r.user.nombre.toLowerCase().includes(buscar) ||
      r.user.email.toLowerCase().includes(buscar) ||
      r.comentario?.toLowerCase().includes(buscar)
    );
  }, [resenas, busqueda]);

  const eliminar = async (id: string) => {
    setMostrarModalEliminar(id);
  };

  const confirmarEliminar = async () => {
    const id = mostrarModalEliminar;
    if (!id) return;
    setMostrarModalEliminar(null);
    setEliminando(id);
    try {
      const res = await fetch(`/api/resenas/admin?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setResenas((prev) => prev.filter((r) => r.id !== id));
        
        if (verificadas) {
          setContadorPublicadas(prev => Math.max(0, prev - 1));
        } else {
          setContadorPendientes(prev => Math.max(0, prev - 1));
        }
        mostrarToast('Reseña eliminada', 'success');
      } else {
        mostrarToast('Error al eliminar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarToast('Error de conexión', 'error');
    } finally {
      setEliminando(null);
    }
  };

  const aprobar = async (id: string) => {
    setEliminando(id);
    try {
      const res = await fetch('/api/resenas/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aprobado: true }),
      });
      if (res.ok) {
        setResenas(prev => prev.filter(r => r.id !== id));
        setContadorPendientes(prev => Math.max(0, prev - 1));
        setContadorPublicadas(prev => prev + 1);
        mostrarToast('Reseña aprobada', 'success');
      } else {
        mostrarToast('Error al aprobar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarToast('Error de conexión', 'error');
    } finally {
      setEliminando(null);
    }
  };

  if (status === 'loading' || cargando) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Reseñas
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {contadorPendientes + contadorPublicadas} reseñas en total
            </p>
          </div>
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Volver al admin
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por local, usuario o comentario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
            />
          </div>
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl shadow-sm p-1 mb-6 flex">
          <button
            onClick={() => cambiarPestana(false)}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              !verificadas 
                ? 'bg-amber-500 text-white' 
                : 'text-gray-600 hover:bg-[var(--bg)]'
            }`}
          >
            ⏳ Pendientes ({contadorPendientes})
          </button>
          <button
            onClick={() => cambiarPestana(true)}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              verificadas 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:bg-[var(--bg)]'
            }`}
          >
            ✓ Publicadas ({contadorPublicadas})
          </button>
        </div>

        {resenasFiltradas.length === 0 ? (
          <div className="bg-[var(--card-bg)] rounded-xl p-12 shadow-sm text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-gray-500">
              {busqueda 
                ? 'No se encontraron reseñas' 
                : verificadas 
                  ? 'No hay reseñas publicadas' 
                  : 'No hay reseñas pendientes'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resenasFiltradas.map((resena) => (
              <div key={resena.id} className="bg-[var(--card-bg)] rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-bold text-gray-900">{resena.calificacion}/5</span>
                      <span className="text-sm text-gray-500">
                        por {resena.user.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <span>📍</span>
                      <span>para:</span>
                      <Link 
                        href={`/local/${resena.local.id}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {resena.local.nombre}
                      </Link>
                    </div>
                    {resena.comentario && (
                      <p className="text-gray-600 text-sm mt-2 bg-[var(--bg)] p-2 rounded">{resena.comentario}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {resena.user.email} • {new Date(resena.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!resena.aprobado && (
                      <button
                        onClick={() => aprobar(resena.id)}
                        disabled={eliminando === resena.id}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        ✓ Aprobar
                      </button>
                    )}
                    <button
                      onClick={() => eliminar(resena.id)}
                      disabled={eliminando === resena.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {eliminando === resena.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                ¿Eliminar reseña?
              </h3>
              <p className="text-gray-500 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModalEliminar(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando === mostrarModalEliminar}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {eliminando === mostrarModalEliminar ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}