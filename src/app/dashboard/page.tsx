'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import { mostrarToast } from '@/components/Toast';
import NuevoLocalModal from '@/components/NuevoLocalModal';
import EditarLocalModal from '@/components/EditarLocalModal';
import LocalCard from '@/components/LocalCard';

interface Local {
  id: string;
  nombre: string;
  categorias: string;
  items: string;
  activo: boolean;
  precio: number | null;
  descripcion: string;
  createdAt: string;
  userId: string;
  colaboradoresCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [locales, setLocales] = useState<Local[]>([]);
  const [colaborando, setColaborando] = useState<any[]>([]);
  const [edicionesPendientes, setEdicionesPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mis-locales' | 'colaborando' | 'sugerencias'>('mis-locales');
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [localEditando, setLocalEditando] = useState<Local | null>(null);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [localAEliminar, setLocalAEliminar] = useState<Local | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [showColaboradoresModal, setShowColaboradoresModal] = useState(false);
  const [localColaboradores, setLocalColaboradores] = useState<any[]>([]);
  const [localMostrandoColaboradores, setLocalMostrandoColaboradores] = useState<Local | null>(null);
  const [colaboradorAEliminar, setColaboradorAEliminar] = useState<any>(null);
  const [showEliminarColaboradorModal, setShowEliminarColaboradorModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth'); }, [status, router]);

  useEffect(() => {
if (status === 'authenticated') {
      fetchLocales();
      fetchColaborando();
      fetchEdicionesPendientes();
      if (searchParams.get('nuevo') === 'true') setShowNuevoModal(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && searchParams.get('nuevo') === 'true') {
      setShowNuevoModal(true);
    }
  }, [status, searchParams]);

  const fetchLocales = async () => {
    try { const res = await fetch('/api/locales/mis-locales'); if (res.ok) setLocales(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchColaborando = async () => {
    try { const res = await fetch('/api/colaboradores/mis-colaboraciones'); if (res.ok) setColaborando(await res.json()); } catch (e) { console.error(e); }
  };
  const fetchEdicionesPendientes = async () => {
    try { const res = await fetch('/api/ediciones?recibidas=true'); if (res.ok) setEdicionesPendientes(await res.json()); } catch (e) { console.error(e); }
  };

  const gestionarEdicion = async (eid: string, accion: 'aprobar' | 'rechazar') => {
    try {
      const res = await fetch(`/api/ediciones/${eid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edicionId: eid, accion }) });
      if (res.ok) { fetchEdicionesPendientes(); if (accion === 'aprobar') fetchLocales(); mostrarToast(accion === 'aprobar' ? 'Sugerencia aprobada' : 'Sugerencia rechazada', 'success'); }
      else mostrarToast('Error al gestionar', 'error');
    } catch (e) { console.error(e); }
  };

  const abrirColaboradores = async (local: Local) => {
    try {
      const res = await fetch(`/api/colaboradores?localId=${local.id}`);
      if (res.ok) { setLocalColaboradores(await res.json()); setLocalMostrandoColaboradores(local); setShowColaboradoresModal(true); }
    } catch (e) { console.error(e); }
  };

  const gestionarColaborador = async (cid: string, accion: 'aprobar' | 'rechazar' | 'bloquear' | 'desbloquear') => {
    setLocalColaboradores(prev => prev.map(c => {
      if (c.id !== cid) return c;
      if (accion === 'bloquear') return { ...c, bloqueo: true, aprobado: false };
      if (accion === 'desbloquear') return { ...c, bloqueo: false };
      if (accion === 'aprobar') return { ...c, aprobado: true, rechazado: false };
      if (accion === 'rechazar') return { ...c, rechazado: true, aprobado: false };
      return c;
    }));
    try {
      const res = await fetch(`/api/colaboradores/${cid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colaboradorId: cid, accion }) });
      if (res.ok) {
        abrirColaboradores(localMostrandoColaboradores!);
        const msgs: Record<string, string> = { aprobar: 'Colaborador aprobado', rechazar: 'Solicitud rechazada', bloquear: 'Usuario bloqueado', desbloquear: 'Usuario desbloqueado' };
        mostrarToast(msgs[accion], 'success');
      } else {
        abrirColaboradores(localMostrandoColaboradores!);
        mostrarToast('Error al gestionar', 'error');
      }
    } catch (e) { abrirColaboradores(localMostrandoColaboradores!); console.error(e); }
  };

  const eliminarColaborador = async (cid: string) => {
    setLocalColaboradores(prev => prev.filter(c => c.id !== cid));
    setLocales(prev => prev.map(l => {
      if (l.id === localMostrandoColaboradores?.id) {
        return { ...l, colaboradoresCount: Math.max(0, l.colaboradoresCount - 1) };
      }
      return l;
    }));
    try {
      const res = await fetch(`/api/colaboradores/${cid}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarToast('Colaborador eliminado', 'success');
      } else {
        abrirColaboradores(localMostrandoColaboradores!);
        mostrarToast('Error al eliminar', 'error');
      }
    } catch (e) { abrirColaboradores(localMostrandoColaboradores!); console.error(e); }
  };

  const toggleActivo = async (local: Local) => {
    try {
      const res = await fetch(`/api/locales/${local.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !local.activo }) });
      if (res.ok) { fetchLocales(); mostrarToast(local.activo ? 'Local desactivado' : 'Local activado', 'success'); }
      else mostrarToast('Error al cambiar estado', 'error');
    } catch (e) { console.error(e); }
  };

  const abrirEditor = (l: Local) => { setLocalEditando(l); setShowEditarModal(true); };
  const confirmarEliminar = (l: Local) => { setLocalAEliminar(l); setShowEliminarModal(true); };
  const eliminarLocal = async () => {
    if (!localAEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`/api/locales/${localAEliminar.id}`, { method: 'DELETE' });
      if (res.ok) { fetchLocales(); setShowEliminarModal(false); setLocalAEliminar(null); mostrarToast('Local eliminado', 'success'); }
      else mostrarToast('Error al eliminar', 'error');
    } catch (e) { console.error(e); } finally { setEliminando(false); }
  };

  const tabs = [
    { id: 'mis-locales' as const, label: 'Mis Locales', icon: '🏪', count: locales.length },
    { id: 'colaborando' as const, label: 'Colaborando', icon: '🤝', count: colaborando.length },
    { id: 'sugerencias' as const, label: 'Sugerencias', icon: '💡', count: edicionesPendientes.length, hide: edicionesPendientes.length === 0 },
  ];

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || '?';
  const totalLocales = locales.length;
  const activos = locales.filter(l => l.activo).length;

  const filtrados = useMemo(() => {
    return locales.filter(l => {
      const matchEstado = filtroEstado === 'todos' || (filtroEstado === 'activos' ? l.activo : !l.activo);
      const matchBusqueda = !busqueda || l.nombre.toLowerCase().includes(busqueda.toLowerCase()) || l.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [locales, filtroEstado, busqueda]);

  if (status === 'loading' || loading) {
    return <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-gray-50"><div className="flex items-center gap-3 text-gray-400"><span className="animate-spin text-xl">⏳</span><p>Cargando panel...</p></div></div>;
  }

  const formatValor = (key: string, val: any): string => {
    if (val === null || val === undefined) return '(vacío)';
    if (key === 'categorias') { try { return JSON.parse(val).join(', '); } catch { return String(val); } }
    if (key === 'items') { try { return JSON.parse(val).map((i: any) => `${i.nombre} $${i.precio}`).join(', '); } catch { return String(val); } }
    if (key === 'activo') return val ? 'Visible' : 'Oculto';
    return String(val);
  };

  const labels: Record<string, string> = {
    nombre: 'Nombre', descripcion: 'Descripción', categorias: 'Categorías', items: 'Productos/Servicios',
    precio: 'Precio', direccion: 'Dirección', telefono: 'Teléfono', redesSociales: 'Redes Sociales',
    sitioWeb: 'Sitio Web', imagenes: 'Imágenes', activo: 'Activo',
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-bold">{userInitial}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session?.user?.name}</h1>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => setShowNuevoModal(true)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg">+</span> Nuevo Local
          </button>
        </div>

        {/* STATS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-gray-100">
            <div className="px-4 first:pl-0 last:pr-0">
              <p className="text-2xl font-bold text-gray-900">{totalLocales}</p>
              <p className="text-xs text-gray-400 mt-0.5">Locales</p>
            </div>
            <div className="px-4 first:pl-0 last:pr-0">
              <p className="text-2xl font-bold text-green-600">{activos}</p>
              <p className="text-xs text-gray-400 mt-0.5">Activos</p>
            </div>
            <div className="px-4 first:pl-0 last:pr-0">
              <p className="text-2xl font-bold text-red-500">{totalLocales - activos}</p>
              <p className="text-xs text-gray-400 mt-0.5">Inactivos</p>
            </div>
            <div className="px-4 first:pl-0 last:pr-0">
              <p className="text-2xl font-bold text-blue-600">{colaborando.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Colaboradores</p>
            </div>
            <div className="px-4 first:pl-0 last:pr-0">
              <p className="text-2xl font-bold text-amber-600">{edicionesPendientes.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Sugerencias</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {tabs.filter(t => !t.hide).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'}`}>
              {t.icon} {t.label}
              {t.count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div>
          {/* MIS LOCALES */}
          {tab === 'mis-locales' && (locales.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin locales aún</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Crea tu primer local para aparecer en el directorio de la ciudad</p>
              <button onClick={() => setShowNuevoModal(true)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">+ Crear mi primer local</button>
            </div>
          ) : (
            <div>
              {/* Filter bar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar local..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>}
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {(['todos', 'activos', 'inactivos'] as const).map(f => (
                    <button key={f} onClick={() => setFiltroEstado(f)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filtroEstado === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filtrados.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                  <p className="text-gray-400">No se encontraron locales con estos filtros</p>
                  <button onClick={() => { setBusqueda(''); setFiltroEstado('todos'); }} className="text-blue-600 text-sm mt-2 hover:underline">Limpiar filtros</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtrados.map(local => (
                    <LocalCard key={local.id} local={local}
                      onEdit={() => abrirEditor(local)}
                      onCollaborators={() => abrirColaboradores(local)}
                      onDelete={() => confirmarEliminar(local)}
                      onToggleActive={() => toggleActivo(local)} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* COLABORANDO */}
          {tab === 'colaborando' && (colaborando.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No colaboras en ningún local</h3>
              <p className="text-gray-500 mb-6">Busca locales en el directorio y solicita colaborar</p>
              <Link href="/buscar" className="text-blue-600 font-semibold hover:underline">Explorar directorio →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {colaborando.map(colab => {
                const cats: string[] = JSON.parse(colab.local.categorias || '[]');
                return (
                  <div key={colab.local.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          {cats.slice(0, 3).map((cat: string) => (
                            <span key={cat} className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{cat}</span>
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Colaborador</span>
                      </div>
                      <Link href={`/local/${colab.local.id}?from=panel`}><h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{colab.local.nombre}</h3></Link>
                      <p className="text-xs text-gray-400 mb-3">Dueño: {colab.local.user?.nombre}</p>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{colab.local.descripcion}</p>
                    </div>
                    <div className="border-t border-gray-100">
                      <button onClick={() => { setLocalEditando({ ...colab.local, userId: colab.local.userId }); setShowEditarModal(true); }}
                        className="w-full text-center text-xs text-blue-600 font-medium hover:bg-blue-50 py-3 transition-colors">💡 Sugerir Cambio</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* SUGERENCIAS */}
          {tab === 'sugerencias' && (edicionesPendientes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin sugerencias</h3>
              <p className="text-gray-500">No hay sugerencias de edición pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {edicionesPendientes.map(ed => {
                const cambios = JSON.parse(ed.datos);
                const entries = Object.entries(cambios);
                return (
                  <div key={ed.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">{ed.usuario?.nombre?.charAt(0) || '?'}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{ed.usuario?.nombre}</p>
                          <p className="text-xs text-gray-400">{ed.local?.nombre} · {entries.length} cambio{entries.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => gestionarEdicion(ed.id, 'aprobar')} className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">Aprobar</button>
                        <button onClick={() => gestionarEdicion(ed.id, 'rechazar')} className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Rechazar</button>
                      </div>
                    </div>
                    {entries.length > 0 && (
                      <details className="group">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">Ver cambios</summary>
                        <div className="mt-2 space-y-1">
                          {entries.map(([key, val]: [string, any]) => (
                            <div key={key} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400 w-28 flex-shrink-0">{labels[key] || key}</span>
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">{formatValor(key, val)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <NuevoLocalModal isOpen={showNuevoModal} onClose={() => setShowNuevoModal(false)} onActualizar={fetchLocales} />
      {localEditando && <EditarLocalModal isOpen={showEditarModal} onClose={() => { setShowEditarModal(false); setLocalEditando(null); }} localId={localEditando.id} onActualizar={fetchLocales} />}

      {showEliminarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
              <h3 className="text-lg font-bold text-gray-900">¿Eliminar local?</h3>
              <p className="text-sm text-gray-500 mt-2">¿Eliminar <span className="font-semibold text-gray-700">{localAEliminar?.nombre}</span>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEliminarModal(false); setLocalAEliminar(null); }} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={eliminarLocal} disabled={eliminando} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors text-sm">{eliminando ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {showColaboradoresModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Colaboradores</h3>
              <button onClick={() => setShowColaboradoresModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{localMostrandoColaboradores?.nombre}</p>
            {localColaboradores.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">No hay colaboradores aún</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {localColaboradores.map(colab => (
                  <div key={colab.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">{colab.usuario?.nombre?.charAt(0) || '?'}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{colab.usuario?.nombre}</p>
                        <p className="text-xs text-gray-400">{colab.usuario?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {colab.aprobado ? (
                        <>
                          <span className="text-xs text-green-600 font-medium">✓ Aprobado</span>
                          <button onClick={() => gestionarColaborador(colab.id, 'bloquear')} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Bloquear</button>
                          <button onClick={() => { setColaboradorAEliminar(colab); setShowEliminarColaboradorModal(true); }} className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded">🗑️</button>
                        </>
                      ) : colab.bloqueo ? (
                        <>
                          <span className="text-xs text-red-500 font-medium">🚫 Bloqueado</span>
                          <button onClick={() => gestionarColaborador(colab.id, 'desbloquear')} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded">Desbloquear</button>
                          <button onClick={() => { setColaboradorAEliminar(colab); setShowEliminarColaboradorModal(true); }} className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded">🗑️</button>
                        </>
                      ) : colab.rechazado ? (
                        <>
                          <span className="text-xs text-gray-400 font-medium">✕ Rechazado</span>
                          <button onClick={() => gestionarColaborador(colab.id, 'aprobar')} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded">Reactivar</button>
                          <button onClick={() => { setColaboradorAEliminar(colab); setShowEliminarColaboradorModal(true); }} className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded">🗑️</button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-amber-600">Pendiente</span>
                          <button onClick={() => gestionarColaborador(colab.id, 'aprobar')} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded">✓</button>
                          <button onClick={() => gestionarColaborador(colab.id, 'rechazar')} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">✕</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEliminarColaboradorModal && colaboradorAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
              <h3 className="text-lg font-bold text-gray-900">¿Eliminar colaborador?</h3>
              <p className="text-sm text-gray-500 mt-2">
                ¿Eliminar a <span className="font-semibold text-gray-700">{colaboradorAEliminar.usuario?.nombre}</span> de este local?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEliminarColaboradorModal(false); setColaboradorAEliminar(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={() => { eliminarColaborador(colaboradorAEliminar.id); setShowEliminarColaboradorModal(false); setColaboradorAEliminar(null); }} className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}