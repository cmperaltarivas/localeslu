'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import DropdownSelect from '@/components/DropdownSelect';

interface Local {
  id: string;
  nombre: string;
  categorias: string;
  precio: number | null;
  direccion: string | null;
  imagenes: string;
  rating: number;
  reseñasCount: number;
}

const categorias = [
  'Todas', 'Alimentación', 'Vestimenta', 'Hogar', 'Servicios',
  'Tecnología', 'Salud', 'Educación', 'Entretenimiento',
  'Belleza', 'Deportes', 'Otros',
];

const ordenes = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'mejor-evaluado', label: 'Mejor evaluados' },
];

function BuscarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || 'Todas');
  const [orden, setOrden] = useState('recientes');

  useEffect(() => {
    fetchLocales();
  }, [categoria, orden]);

  const fetchLocales = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (categoria !== 'Todas') params.append('categoria', categoria);
    params.append('orden', orden);

    const res = await fetch(`/api/locales?${params.toString()}`);
    const data = await res.json();
    setLocales(data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLocales();
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const aplicarFiltros = () => {
    setQ('');
    setCategoria('Todas');
    setOrden('recientes');
    fetchLocales();
  };

  return (
    <div className="min-h-[calc(100vh-73px)]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <span className="tag tag-forest mb-4">Directorio</span>
          <h1 className="mb-2">Buscar locales y negocios</h1>
          <p className="text-[var(--fg-muted)]">Encuentra lo que necesitas en tu comunidad</p>
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] p-5 mb-8 relative z-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-[var(--fg-muted)] mb-2 font-medium">Buscar</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" placeholder="¿Qué estás buscando?" value={q} onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--fg-muted)] mb-2 font-medium">Categoría</label>
              <DropdownSelect value={categoria} onChange={setCategoria} options={categorias.map(c => ({ value: c, label: c }))} className="w-full" />
            </div>

            <div>
              <label className="block text-sm text-[var(--fg-muted)] mb-2 font-medium">Ordenar por</label>
              <DropdownSelect value={orden} onChange={setOrden} options={ordenes} className="w-full" />
            </div>

            <div className="hidden md:flex items-end">
              {(q || categoria !== 'Todas' || orden !== 'recientes') && (
                <button onClick={aplicarFiltros} className="btn-ghost text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] overflow-hidden">
                <div className="h-48 skeleton rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="h-5 skeleton w-3/4" />
                  <div className="h-4 skeleton w-1/2" />
                  <div className="h-4 skeleton w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : locales.length === 0 ? (
          <div className="text-center py-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)]">
            <div className="w-16 h-16 rounded-full bg-[var(--bg)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <p className="text-[var(--fg-muted)] text-base font-medium">
              {categoria && categoria !== 'Todas' 
                ? `No hay locales de "${categoria}" aún`
                : 'No se encontraron resultados'}
            </p>
            <button onClick={aplicarFiltros} className="btn-ghost mt-3 text-sm">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--fg-muted)] mb-6">
              {locales.length} {locales.length === 1 ? 'resultado' : 'resultados'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {locales.map((local) => (
                <Link
                  key={local.id}
                  href={`/local/${local.id}`}
                  className="group card overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-[var(--bg-alt)]">
                    {local.imagenes && JSON.parse(local.imagenes).length > 0 ? (
                      <img
                        src={JSON.parse(local.imagenes)[0]}
                        alt={local.nombre}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-[var(--muted-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {JSON.parse(local.categorias).slice(0, 2).map((cat: string) => (
                        <span key={cat} className="tag bg-[var(--card-bg)]/90 backdrop-blur-sm text-[var(--fg)] shadow-sm">
                          {cat}
                        </span>
                      ))}
                      {JSON.parse(local.categorias).length > 2 && (
                        <span className="tag bg-[var(--card-bg)]/90 backdrop-blur-sm text-[var(--fg-muted)] shadow-sm">
                          +{JSON.parse(local.categorias).length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors">
                      {local.nombre}
                    </h3>
                    {local.direccion && (
                      <p className="text-sm text-[var(--fg-muted)] mt-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {local.direccion}
                      </p>
                    )}
                    {local.rating > 0 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <svg key={s} className={`w-3 h-3 ${s <= Math.round(local.rating) ? 'text-amber-400' : 'text-[var(--border)]'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs font-medium text-[var(--fg-muted)]">{local.rating}</span>
                        <span className="text-xs text-[var(--muted)]">({local.reseñasCount})</span>
                      </div>
                    )}
                    {local.precio && (
                      <p className="text-base font-semibold text-[var(--accent)] mt-2 tracking-tight">
                        {local.precio.toLocaleString('es-CL')} CLP
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    }>
      <BuscarContent />
    </Suspense>
  );
}