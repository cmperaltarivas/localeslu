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
}

const categorias = [
  'Todas',
  'Alimentación',
  'Vestimenta',
  'Hogar',
  'Servicios',
  'Tecnología',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Belleza',
  'Deportes',
  'Otros',
];

function BuscarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || 'Todas');

  useEffect(() => {
    fetchLocales();
  }, [categoria]);

  const fetchLocales = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (categoria !== 'Todas') params.append('categoria', categoria);

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
    fetchLocales();
  };

  return (
    <div className="min-h-[calc(100vh-73px)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl text-gray-900 mb-6 animate-fade-in">Buscar locales y negocios</h1>

        <div className="card p-5 mb-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Buscar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">🔍</span>
                <input
                  type="text"
                  placeholder="Palabra clave..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Categoría
              </label>
              <DropdownSelect
                value={categoria}
                onChange={setCategoria}
                options={categorias.map(c => ({ value: c, label: c }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : locales.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-base">
              {categoria && categoria !== 'Todas' 
                ? `No hay locales de "${categoria}" aún`
                : 'No se encontraron resultados'}
            </p>
            <button onClick={aplicarFiltros} className="text-blue-600 hover:underline mt-2 text-sm font-medium">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {locales.map((local) => (
              <Link
                key={local.id}
                href={`/local/${local.id}`}
                className="card group overflow-hidden"
              >
                <div className="h-44 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  {local.imagenes && JSON.parse(local.imagenes).length > 0 ? (
                    <img
                      src={JSON.parse(local.imagenes)[0]}
                      alt={local.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-4xl text-gray-300">🏪</span>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {JSON.parse(local.categorias).slice(0, 2).map((cat: string) => (
                      <span key={cat} className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-blue-600">
                        {cat}
                      </span>
                    ))}
                    {JSON.parse(local.categorias).length > 2 && (
                      <span className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-500">
                        +{JSON.parse(local.categorias).length - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {local.nombre}
                  </h3>
                  {local.direccion && (
                    <p className="text-sm text-gray-500 mt-1.5">
                      📍 {local.direccion}
                    </p>
                  )}
                  {local.precio && (
                    <p className="text-base font-medium text-blue-600 mt-2">
                      {local.precio.toLocaleString('es-CL')} CLP
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
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