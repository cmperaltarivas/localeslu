'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mostrarToast } from '@/components/Toast';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  locales: Local[];
  _count: { resenas: number };
}

interface Local {
  id: string;
  nombre: string;
  categorias: string;
  activo: boolean;
}

const ADMIN_EMAIL = 'cmperaltarivas@gmail.com';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [resenasPendientes, setResenasPendientes] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modalTipo, setModalTipo] = useState<'eliminar' | 'desactivar' | 'activar'>('eliminar');
  const [procesando, setProcesando] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [verResenas, setVerResenas] = useState<Usuario | null>(null);
  const [resenasUsuario, setResenasUsuario] = useState<any[]>([]);
  const [verLocales, setVerLocales] = useState<Usuario | null>(null);
  const [stats, setStats] = useState({ totalUsuarios: 0, usuariosActivos: 0, totalLocales: 0, localesActivos: 0, totalResenas: 0, resenasPendientes: 0, totalColaboradores: 0 });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || session?.user?.email !== ADMIN_EMAIL) router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email === ADMIN_EMAIL) fetchUsuarios();
  }, [status, session]);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios');
      if (res.ok) setUsuarios(await res.json());
      const resP = await fetch('/api/resenas/admin?pendientes=true');
      if (resP.ok) setResenasPendientes((await resP.json()).length);
      const resS = await fetch('/api/admin/stats');
      if (resS.ok) setStats(await resS.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const abrirModal = (u: Usuario, t: 'eliminar' | 'desactivar' | 'activar') => {
    setUsuarioSeleccionado(u);
    setModalTipo(t);
    setShowModal(true);
  };

  const confirmarAccion = async () => {
    if (!usuarioSeleccionado) return;
    setProcesando(true);
    try {
      let res;
      if (modalTipo === 'eliminar') res = await fetch(`/api/admin/usuarios/${usuarioSeleccionado.id}`, { method: 'DELETE' });
      else res = await fetch(`/api/admin/usuarios/${usuarioSeleccionado.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: modalTipo === 'activar' }) });
      if (res.ok) { fetchUsuarios(); setShowModal(false); setUsuarioSeleccionado(null); mostrarToast(modalTipo === 'eliminar' ? 'Usuario eliminado' : modalTipo === 'activar' ? 'Usuario activado' : 'Usuario desactivado', 'success'); }
      else mostrarToast('Error', 'error');
    } catch (e) { console.error(e); mostrarToast('Error', 'error'); }
    finally { setProcesando(false); }
  };

  const verResenasUsuario = async (u: Usuario) => {
    setVerResenas(u);
    try {
      const res = await fetch(`/api/resenas?userId=${u.id}`);
      if (res.ok) {
        const data = await res.json();
        setResenasUsuario(data);
      }
    } catch (e) { console.error(e); }
  };

  const reseñasAprobadas = resenasUsuario.filter(r => r.aprobado);
  const reseñasPendientesArr = resenasUsuario.filter(r => !r.aprobado);

  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;

  const uFiltrados = usuarios.filter(u => {
    if (filtro === 'activos' && !u.activo) return false;
    if (filtro === 'inactivos' && u.activo) return false;
    if (busqueda) return u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
            <p className="text-gray-500 text-sm mt-0.5">{stats.totalUsuarios} usuarios · {stats.totalLocales} locales · {stats.totalResenas} reseñas</p>
          </div>
          <a href="/admin/resenas" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-1">
            ⭐ Reseñas {stats.resenasPendientes > 0 && `(${stats.resenasPendientes})`}
          </a>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
            <p className="text-xs text-gray-400 mt-0.5">Usuarios</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{stats.usuariosActivos} activos</span>
              <span className="text-red-400">{stats.totalUsuarios - stats.usuariosActivos} inactivos</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{stats.totalLocales}</p>
            <p className="text-xs text-gray-400 mt-0.5">Locales</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{stats.localesActivos} activos</span>
              <span className="text-red-400">{stats.totalLocales - stats.localesActivos} inactivos</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{stats.totalResenas}</p>
            <p className="text-xs text-gray-400 mt-0.5">Reseñas</p>
            {stats.resenasPendientes > 0 && <p className="text-xs text-amber-600 mt-1">{stats.resenasPendientes} pendientes</p>}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{stats.totalColaboradores}</p>
            <p className="text-xs text-gray-400 mt-0.5">Colaboraciones</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
          <div className="flex gap-2">
            <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filtro === 'todos' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
            <button onClick={() => setFiltro('activos')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filtro === 'activos' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Activos</button>
            <button onClick={() => setFiltro('inactivos')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filtro === 'inactivos' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Inactivos</button>
          </div>
        </div>

        {uFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin resultados</h3>
            <p className="text-gray-500">No se encontraron usuarios con estos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uFiltrados.map(u => {
              const localesActivos = u.locales.filter((l: any) => l.activo).length;
              const localesInactivos = u.locales.length - localesActivos;
              return (
                <div key={u.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden ${!u.activo ? 'bg-gray-50/50' : ''}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${u.activo ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm truncate ${u.activo ? 'text-gray-900' : 'text-gray-400'}`}>{u.nombre}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="flex gap-3 mb-4">
                      <button onClick={() => verResenasUsuario(u)} className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors">
                        ⭐ {u._count?.resenas || 0}
                      </button>
                      <button onClick={() => setVerLocales(u)} className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                        🏪 {u.locales.length}
                        {localesInactivos > 0 && <span className="text-red-400 ml-0.5">· {localesInactivos} inact.</span>}
                      </button>
                    </div>

                    <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                      {u.activo ? (
                        <button onClick={() => abrirModal(u, 'desactivar')} className="flex-1 text-center text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 py-2 rounded-lg transition-colors">
                          Desactivar
                        </button>
                      ) : (
                        <button onClick={() => abrirModal(u, 'activar')} className="flex-1 text-center text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 py-2 rounded-lg transition-colors">
                          Activar
                        </button>
                      )}
                      <button onClick={() => abrirModal(u, 'eliminar')} className="flex-1 text-center text-xs font-medium text-red-500 hover:bg-red-50 py-2 rounded-lg transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6">
              <div className="text-center mb-4">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${modalTipo === 'eliminar' ? 'bg-red-100' : 'bg-orange-100'}`}>
                  <span className="text-2xl">{modalTipo === 'eliminar' ? '🗑️' : modalTipo === 'activar' ? '▶️' : '⏸️'}</span>
                </div>
                <h3 className="font-bold text-lg">{modalTipo === 'eliminar' ? '¿Eliminar?' : modalTipo === 'activar' ? '¿Activar?' : '¿Desactivar?'}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowModal(false); setUsuarioSeleccionado(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
                <button onClick={confirmarAccion} disabled={procesando} className={`flex-1 py-2 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-colors ${modalTipo === 'eliminar' ? 'bg-red-600 hover:bg-red-700' : modalTipo === 'activar' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>{procesando ? '...' : modalTipo === 'eliminar' ? 'Eliminar' : modalTipo === 'activar' ? 'Activar' : 'Desactivar'}</button>
              </div>
            </div>
          </div>
        )}

        {verResenas && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Reseñas de {verResenas.nombre}</h3><button onClick={() => setVerResenas(null)}>✕</button></div>
              <div className="flex gap-4 mb-4 text-sm"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ {reseñasAprobadas.length}</span><span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">⏳ {reseñasPendientesArr.length}</span></div>
              {!resenasUsuario.length ? <p className="text-center py-4">Sin reseñas</p> : (
                <div className="space-y-3">
                  {resenasUsuario.map(r => (
                    <div key={r.id} className={`p-3 rounded-lg ${r.aprobado ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <div className="flex justify-between mb-1">
                        <div className="flex gap-2"><span>{r.aprobado ? '✓' : '⏳'}</span><span>★ {r.calificacion}/5</span></div>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('es-CL')}</span>
                      </div>
                      <p className="text-sm">
                        <Link 
                          href={`/admin/resenas?tab=${r.aprobado ? 'publicadas' : 'pendientes'}`} 
                          className={`px-2 py-1 rounded-full text-xs ${r.aprobado ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                        >
                          🏪 {r.local?.nombre}
                        </Link>
                      </p>
                      {r.comentario && <p className="text-sm mt-1">{r.comentario}</p>}
                      {!r.aprobado && <p className="text-xs text-yellow-600 mt-1">Pendiente</p>}
                      {r.aprobado && <p className="text-xs text-green-600 mt-1">Aprobada</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {verLocales && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Locales de {verLocales.nombre}</h3><button onClick={() => setVerLocales(null)}>✕</button></div>
              {!verLocales.locales.length ? <p className="text-center py-4">Sin locales</p> : (
                <div className="space-y-3">
                  {verLocales.locales.map(l => (
                    <div key={l.id} className={`p-3 rounded-lg ${l.activo ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex justify-between mb-1">
                      {l.activo ? (
                        <Link href={`/local/${l.id}?from=admin`} className="font-medium hover:text-blue-600">{l.nombre}</Link>
                      ) : (
                        <span className="font-medium">{l.nombre}</span>
                      )}
                      {l.activo ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                    </div>
                      <p className="text-xs text-gray-500">{JSON.parse(l.categorias).join(', ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}