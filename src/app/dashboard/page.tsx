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
  colaboradoresPendientes: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [locales, setLocales] = useState<Local[]>([]);
  const [colaborando, setColaborando] = useState<any[]>([]);
  const [edicionesPendientes, setEdicionesPendientes] = useState<any[]>([]);
  const [resenasPendientes, setResenasPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mis-locales' | 'colaborando' | 'sugerencias' | 'resenas'>('mis-locales');
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
      fetchResenasPendientes();
      if (searchParams.get('nuevo') === 'true') setShowNuevoModal(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && searchParams.get('nuevo') === 'true') {
      setShowNuevoModal(true);
    }
  }, [status, searchParams]);

  const fetchLocales = async () => {
    try { const res = await fetch('/api/locales/mis-locales'); if (res.ok) setLocales(await res.json()); } catch { } finally { setLoading(false); }
  };
  const fetchColaborando = async () => {
    try { const res = await fetch('/api/colaboradores/mis-colaboraciones'); if (res.ok) setColaborando(await res.json()); } catch { }
  };
  const fetchEdicionesPendientes = async () => {
    try { const res = await fetch('/api/ediciones?recibidas=true'); if (res.ok) setEdicionesPendientes(await res.json()); } catch { }
  };
  const notificarHeader = () => window.dispatchEvent(new CustomEvent('notificaciones'));
  const fetchResenasPendientes = async () => {
    try { const res = await fetch('/api/resenas/mis-locales'); if (res.ok) setResenasPendientes(await res.json()); } catch { }
  };
  const gestionarResena = async (id: string, aprobado: boolean) => {
    try {
      const res = await fetch('/api/resenas/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, aprobado }) });
      if (res.ok) { fetchResenasPendientes(); notificarHeader(); mostrarToast(aprobado ? 'Reseña aprobada' : 'Reseña rechazada', 'success'); }
      else { const d = await res.json(); mostrarToast(d.error || 'Error', 'error'); }
    } catch { }
  };

  const gestionarEdicion = async (eid: string, accion: 'aprobar' | 'rechazar') => {
    try {
      const res = await fetch(`/api/ediciones/${eid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edicionId: eid, accion }) });
      if (res.ok) { fetchEdicionesPendientes(); notificarHeader(); if (accion === 'aprobar') fetchLocales(); mostrarToast(accion === 'aprobar' ? 'Sugerencia aprobada' : 'Sugerencia rechazada', 'success'); }
      else mostrarToast('Error al gestionar', 'error');
    } catch { }
  };

  const abrirColaboradores = async (local: Local) => {
    try {
      const res = await fetch(`/api/colaboradores?localId=${local.id}`);
      if (res.ok) { setLocalColaboradores(await res.json()); setLocalMostrandoColaboradores(local); setShowColaboradoresModal(true); }
    } catch { }
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
        notificarHeader();
        fetchLocales();
        abrirColaboradores(localMostrandoColaboradores!);
        const msgs: Record<string, string> = { aprobar: 'Colaborador aprobado', rechazar: 'Solicitud rechazada', bloquear: 'Usuario bloqueado', desbloquear: 'Usuario desbloqueado' };
        mostrarToast(msgs[accion], 'success');
      } else {
        abrirColaboradores(localMostrandoColaboradores!);
        mostrarToast('Error al gestionar', 'error');
      }
    } catch { notificarHeader(); fetchLocales(); abrirColaboradores(localMostrandoColaboradores!); }
  };

  const eliminarColaborador = async (cid: string) => {
    try {
      const res = await fetch(`/api/colaboradores/${cid}`, { method: 'DELETE' });
      if (res.ok) {
        notificarHeader();
        fetchLocales();
        abrirColaboradores(localMostrandoColaboradores!);
        mostrarToast('Colaborador eliminado', 'success');
      } else {
        abrirColaboradores(localMostrandoColaboradores!);
        mostrarToast('Error al eliminar', 'error');
      }
    } catch { notificarHeader(); fetchLocales(); abrirColaboradores(localMostrandoColaboradores!); }
  };

  const toggleActivo = async (local: Local) => {
    try {
      const res = await fetch(`/api/locales/${local.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !local.activo }) });
      if (res.ok) { fetchLocales(); mostrarToast(local.activo ? 'Local desactivado' : 'Local activado', 'success'); }
      else mostrarToast('Error al cambiar estado', 'error');
    } catch { }
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
    } catch { } finally { setEliminando(false); }
  };

  const tabs = [
    { id: 'mis-locales' as const, label: 'Mis Locales', icon: '🏪', count: locales.length },
    { id: 'colaborando' as const, label: 'Colaborando', icon: '🤝', count: colaborando.length },
    { id: 'resenas' as const, label: 'Reseñas', icon: '⭐', count: resenasPendientes.length, hide: resenasPendientes.length === 0 },
    { id: 'sugerencias' as const, label: 'Ediciones', icon: '💡', count: edicionesPendientes.length, hide: edicionesPendientes.length === 0 },
  ];

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || '?';
  const totalLocales = locales.length;
  const activos = locales.filter(l => l.activo).length;
  const pendientesColab = locales.reduce((sum, l) => sum + (l.colaboradoresPendientes || 0), 0);

  const filtrados = useMemo(() => {
    return locales.filter(l => {
      const matchEstado = filtroEstado === 'todos' || (filtroEstado === 'activos' ? l.activo : !l.activo);
      const matchBusqueda = !busqueda || l.nombre.toLowerCase().includes(busqueda.toLowerCase()) || l.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [locales, filtroEstado, busqueda]);

  if (status === 'loading' || loading) {
    return <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--bg)]"><div className="flex items-center gap-3 text-gray-600"><span className="animate-spin text-xl">⏳</span><p>Cargando panel...</p></div></div>;
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
    <div className="min-h-[calc(100vh-73px)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-bold">{userInitial}</div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--fg)]">{session?.user?.name}</h1>
              <p className="text-sm text-[var(--fg-muted)]">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => setShowNuevoModal(true)} className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--primary-light)] transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg">+</span> Nuevo Local
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
          <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)]">
            <p className="text-2xl font-bold text-[var(--fg)]">{totalLocales}</p>
            <p className="text-xs text-gray-600 mt-0.5">Locales</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)]">
            <p className="text-2xl font-bold text-green-600">{activos}</p>
            <p className="text-xs text-gray-600 mt-0.5">Activos</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)]">
            <p className="text-2xl font-bold text-red-500">{totalLocales - activos}</p>
            <p className="text-xs text-gray-600 mt-0.5">Inactivos</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)]">
            <p className="text-2xl font-bold text-blue-600">{colaborando.length}</p>
            <p className="text-xs text-gray-600 mt-0.5">Colaboraciones</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)] relative">
            <p className="text-2xl font-bold text-amber-600">{edicionesPendientes.length}</p>
            <p className="text-xs text-gray-600 mt-0.5">Ediciones</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)] relative">
            <p className={`text-2xl font-bold ${pendientesColab > 0 ? 'text-[var(--accent)]' : 'text-gray-600'}`}>{pendientesColab}</p>
            <p className="text-xs text-gray-600 mt-0.5">Solicitudes</p>
            {pendientesColab > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse-soft" />
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {tabs.filter(t => !t.hide).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-[var(--fg)] shadow-sm border border-gray-200' : 'text-[var(--fg-muted)] hover:text-gray-700 hover:bg-white/60'}`}>
              {t.icon} {t.label}
              {t.count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div>
          {/* MIS LOCALES */}
          {tab === 'mis-locales' && (locales.length === 0 ? (
            <div className="bg-[var(--card-bg)] rounded-xl p-12 text-center shadow-sm border border-[var(--border-light)]">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">Sin locales aún</h3>
              <p className="text-[var(--fg-muted)] mb-6 max-w-sm mx-auto">Crea tu primer local para aparecer en el directorio de la ciudad</p>
              <button onClick={() => setShowNuevoModal(true)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--primary-light)] transition-colors">+ Crear mi primer local</button>
            </div>
          ) : (
            <div>
              {/* Filter bar */}
              <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--border-light)] mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔍</span>
                  <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar local..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg)] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600">×</button>}
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {(['todos', 'activos', 'inactivos'] as const).map(f => (
                    <button key={f} onClick={() => setFiltroEstado(f)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filtroEstado === f ? 'bg-white text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-gray-700'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filtrados.length === 0 ? (
                <div className="bg-[var(--card-bg)] rounded-xl p-12 text-center shadow-sm border border-[var(--border-light)]">
                  <p className="text-gray-600">No se encontraron locales con estos filtros</p>
                  <button onClick={() => { setBusqueda(''); setFiltroEstado('todos'); }} className="text-[var(--primary)] text-sm mt-2 hover:underline">Limpiar filtros</button>
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
            <div className="bg-[var(--card-bg)] rounded-xl p-12 text-center shadow-sm border border-[var(--border-light)]">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">No colaboras en ningún local</h3>
              <p className="text-[var(--fg-muted)] mb-6">Busca locales en el directorio y solicita colaborar</p>
              <Link href="/buscar" className="text-[var(--primary)] font-semibold hover:underline">Explorar directorio →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {colaborando.map(colab => {
                const cats: string[] = JSON.parse(colab.local.categorias || '[]');
                return (
                  <div key={colab.local.id} className="group bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-light)] hover:shadow-md transition-shadow flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          {cats.slice(0, 3).map((cat: string) => (
                            <span key={cat} className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{cat}</span>
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Colaborador</span>
                      </div>
                      <Link href={`/local/${colab.local.id}?from=panel`}><h3 className="font-semibold text-[var(--fg)] mb-1 group-hover:text-[var(--primary)] transition-colors">{colab.local.nombre}</h3></Link>
                      <p className="text-xs text-gray-600 mb-3">Dueño: {colab.local.user?.nombre}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{colab.local.descripcion}</p>
                    </div>
                    <div className="border-t border-[var(--border-light)]">
                      <button onClick={() => { setLocalEditando({ ...colab.local, userId: colab.local.userId }); setShowEditarModal(true); }}
                        className="w-full text-center text-xs text-[var(--primary)] font-medium hover:bg-blue-50 py-3 transition-colors">💡 Sugerir Cambio</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* RESEÑAS */}
          {tab === 'resenas' && (resenasPendientes.length === 0 ? (
            <div className="bg-[var(--card-bg)] rounded-xl p-12 text-center shadow-sm border border-[var(--border-light)]">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">Sin reseñas pendientes</h3>
              <p className="text-[var(--fg-muted)]">Las reseñas que hagan en tus locales aparecerán aquí para aprobarlas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resenasPendientes.map(r => (
                <div key={r.id} className="bg-[var(--card-bg)] rounded-xl p-5 shadow-sm border border-[var(--border-light)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <svg key={s} className={`w-3.5 h-3.5 ${s <= r.calificacion ? 'text-amber-400' : 'text-[var(--border)]'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-[var(--fg)]">{r.calificacion}/5</span>
                      </div>
                      <p className="text-sm text-[var(--fg-muted)] mb-1">
                        por {r.user.nombre} en <span className="font-medium text-[var(--primary)]">{r.local.nombre}</span>
                      </p>
                      {r.comentario && (
                        <p className="text-sm text-[var(--fg)] bg-[var(--bg)] p-3 rounded-lg mt-2">{r.comentario}</p>
                      )}
                      <p className="text-xs text-[var(--fg-muted)] mt-2">{new Date(r.createdAt).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => gestionarResena(r.id, true)} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-light)] transition-colors">Aprobar</button>
                      <button onClick={() => gestionarResena(r.id, false)} className="px-4 py-2 rounded-lg bg-[var(--bg)] text-[var(--fg-muted)] text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors">Rechazar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* SUGERENCIAS */}
          {tab === 'sugerencias' && (edicionesPendientes.length === 0 ? (
            <div className="bg-[var(--card-bg)] rounded-xl p-12 text-center shadow-sm border border-[var(--border-light)]">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">Sin sugerencias</h3>
              <p className="text-[var(--fg-muted)]">No hay sugerencias de edición pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {edicionesPendientes.map(ed => {
                const cambios = JSON.parse(ed.datos);
                const entries = Object.entries(cambios);
                return (
                  <div key={ed.id} className="bg-[var(--card-bg)] rounded-xl p-5 shadow-sm border border-[var(--border-light)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">{ed.usuario?.nombre?.charAt(0) || '?'}</div>
                        <div>
                          <p className="font-medium text-[var(--fg)] text-sm">{ed.usuario?.nombre}</p>
                          <p className="text-xs text-gray-600">{ed.local?.nombre} · {entries.length} cambio{entries.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => gestionarEdicion(ed.id, 'aprobar')} className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">Aprobar</button>
                        <button onClick={() => gestionarEdicion(ed.id, 'rechazar')} className="px-3 py-2 text-xs font-medium text-[var(--fg-muted)] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Rechazar</button>
                      </div>
                    </div>
                    {entries.length > 0 && (
                      <details className="group">
                        <summary className="text-xs text-[var(--primary)] cursor-pointer hover:underline">Ver cambios</summary>
                        <div className="mt-2 space-y-1">
                          {entries.map(([key, val]: [string, any]) => (
                            <div key={key} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600 w-28 flex-shrink-0">{labels[key] || key}</span>
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
          <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
              <h3 className="text-lg font-bold text-[var(--fg)]">¿Eliminar local?</h3>
              <p className="text-sm text-[var(--fg-muted)] mt-2">¿Eliminar <span className="font-semibold text-gray-700">{localAEliminar?.nombre}</span>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEliminarModal(false); setLocalAEliminar(null); }} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={eliminarLocal} disabled={eliminando} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors text-sm">{eliminando ? <span className="spinner" /> : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {showColaboradoresModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--fg)]">Colaboradores</h3>
              <button onClick={() => setShowColaboradoresModal(false)} className="text-gray-600 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-xs text-gray-600 mb-4">{localMostrandoColaboradores?.nombre}</p>
            {localColaboradores.length === 0 ? (
              <p className="text-gray-600 text-center py-8 text-sm">No hay colaboradores aún</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {localColaboradores.map(colab => (
                  <div key={colab.id} className="flex items-center justify-between bg-[var(--bg)] rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">{colab.usuario?.nombre?.charAt(0) || '?'}</div>
                      <div>
                        <p className="text-sm font-medium text-[var(--fg)]">{colab.usuario?.nombre}</p>
                        <p className="text-xs text-gray-600">{colab.usuario?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {colab.aprobado ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 whitespace-nowrap">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            Aprobado
                          </span>
                          <button onClick={() => gestionarColaborador(colab.id, 'bloquear')} className="text-[10px] font-medium text-red-500 hover:bg-red-50 px-2 py-1.5 rounded transition-colors whitespace-nowrap">Bloquear</button>
                          <button onClick={() => { setColaboradorAEliminar(colab); setShowEliminarColaboradorModal(true); }} className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </>
                      ) : colab.bloqueo ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 whitespace-nowrap">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Bloqueado
                          </span>
                          <button onClick={() => gestionarColaborador(colab.id, 'desbloquear')} className="text-[10px] font-medium text-green-600 hover:bg-green-50 px-1.5 py-1 rounded transition-colors whitespace-nowrap">Desbloquear</button>
                          <button onClick={() => { setColaboradorAEliminar(colab); setShowEliminarColaboradorModal(true); }} className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </>
                      ) : colab.rechazado ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Rechazado
                          </span>
                          <button onClick={() => gestionarColaborador(colab.id, 'aprobar')} className="text-[10px] font-medium text-green-600 hover:bg-green-50 px-1.5 py-1 rounded transition-colors whitespace-nowrap">Reactivar</button>
                          <button onClick={() => { setColaboradorAEliminar(colab); setShowEliminarColaboradorModal(true); }} className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
                            <svg className="w-3 h-3 animate-pulse-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Pendiente
                          </span>
                          <button onClick={() => gestionarColaborador(colab.id, 'aprobar')} className="text-[10px] font-medium text-green-600 hover:bg-green-50 px-1.5 py-1 rounded transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button onClick={() => gestionarColaborador(colab.id, 'rechazar')} className="text-[10px] font-medium text-red-500 hover:bg-red-50 px-1.5 py-1 rounded transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
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
          <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
              <h3 className="text-lg font-bold text-[var(--fg)]">¿Eliminar colaborador?</h3>
              <p className="text-sm text-[var(--fg-muted)] mt-2">
                ¿Eliminar a <span className="font-semibold text-gray-700">{colaboradorAEliminar.usuario?.nombre}</span> de este local?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEliminarColaboradorModal(false); setColaboradorAEliminar(null); }} className="flex-1 bg-[var(--bg)] text-[var(--fg)] py-3 px-4 rounded-xl font-semibold hover:bg-[var(--bg-alt)] transition-colors text-sm">Cancelar</button>
              <button onClick={() => { eliminarColaborador(colaboradorAEliminar.id); setShowEliminarColaboradorModal(false); setColaboradorAEliminar(null); }} className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}