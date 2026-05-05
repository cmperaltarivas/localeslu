import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatearPrecio } from '@/lib/utils';

export default async function Home() {
  const locales = await prisma.local.findMany({
    where: { activo: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const categorias = [
    { nombre: 'Alimentación', emoji: '🍔' },
    { nombre: 'Vestimenta', emoji: '👕' },
    { nombre: 'Hogar', emoji: '🏠' },
    { nombre: 'Servicios', emoji: '🔧' },
    { nombre: 'Tecnología', emoji: '💻' },
    { nombre: 'Salud', emoji: '💊' },
    { nombre: 'Educación', emoji: '📚' },
    { nombre: 'Entretenimiento', emoji: '🎮' },
    { nombre: 'Belleza', emoji: '💅' },
    { nombre: 'Deportes', emoji: '⚽' },
    { nombre: 'Otros', emoji: '📦' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)]">
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-gray-900 mb-6 leading-tight animate-fade-in">
            Descubre locales y<br/>
            <span className="text-blue-600">negocios cerca de ti</span>
          </h1>
          <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto animate-fade-in stagger-1">
            El directorio donde emprendedores y negocios locales comparten lo que ofrecen
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in stagger-2">
            <Link
              href="/buscar"
              className="btn-primary"
            >
              Explorar Directorio
            </Link>
            <Link
              href="/dashboard?nuevo=true"
              className="btn-secondary"
            >
              Registrar mi Negocio
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl text-gray-800 mb-8 text-center animate-fade-in stagger-2">
            Explora por categoría
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-11 gap-2">
            {categorias.map((cat, i) => (
              <Link
                key={cat.nombre}
                href={`/buscar?categoria=${encodeURIComponent(cat.nombre)}`}
                className="card flex flex-col items-center gap-2 p-3 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs text-gray-600">{cat.nombre}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {locales.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 animate-fade-in stagger-3">
              <h2 className="text-xl text-gray-900">
                Recientes
              </h2>
              <Link
                href="/buscar"
                className="text-blue-600 font-medium hover:underline text-sm"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {locales.map((local, i) => (
                <Link
                  key={local.id}
                  href={`/local/${local.id}`}
                  className="card group overflow-hidden"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
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
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      <span className="text-xs font-medium text-blue-600">
                        {JSON.parse(local.categorias)[0]}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {local.nombre}
                    </h3>
                    {local.direccion && (
                      <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1">
                        📍 {local.direccion}
                      </p>
                    )}
                    {local.precio && (
                      <p className="text-base font-medium text-blue-600 mt-2">
                        {formatearPrecio(local.precio)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl text-white mb-3 animate-fade-in stagger-3">
            ¿Tienes un negocio local?
          </h2>
          <p className="text-gray-400 text-base mb-6 animate-fade-in stagger-4">
            Regístralo gratis y dale visibilidad en tu comunidad
          </p>
          <Link
            href="/dashboard?nuevo=true"
            className="btn-primary animate-fade-in stagger-5"
          >
            Registrar mi Negocio
          </Link>
        </div>
      </section>
    </div>
  );
}