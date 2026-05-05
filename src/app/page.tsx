import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatearPrecio } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const locales = await prisma.local.findMany({
    where: { activo: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const localesConImg = locales.filter(l => l.imagenes && JSON.parse(l.imagenes).length > 0);
  const heroLocal = localesConImg.length > 0 ? localesConImg[0] : null;

  const categorias = [
    { nombre: 'Alimentación', emoji: '🥘' },
    { nombre: 'Vestimenta', emoji: '🧥' },
    { nombre: 'Hogar', emoji: '🛋️' },
    { nombre: 'Servicios', emoji: '🛠️' },
    { nombre: 'Tecnología', emoji: '💻' },
    { nombre: 'Salud', emoji: '💚' },
    { nombre: 'Educación', emoji: '📖' },
    { nombre: 'Entretenimiento', emoji: '🎭' },
    { nombre: 'Belleza', emoji: '✨' },
    { nombre: 'Deportes', emoji: '⚽' },
    { nombre: 'Otros', emoji: '📦' },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[var(--bg)] py-32 sm:py-40 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[var(--accent)]/4 blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/8 text-[var(--primary)] text-xs font-medium mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse-soft" />
            Directorio local de La Unión
          </div>

          <h1 className="mb-6 animate-fade-up stagger-1 leading-[1.05]">
            Descubre negocios<br/>
            <span className="text-[var(--primary)]">locales cerca de ti</span>
          </h1>

          <p className="text-[var(--fg-muted)] text-lg sm:text-xl mb-10 max-w-2xl mx-auto animate-fade-up stagger-2 leading-relaxed">
            El directorio donde emprendedores y negocios de la comunidad comparten lo que ofrecen
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-3">
            <Link href="/buscar" className="btn-primary text-base !px-8 !py-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Explorar Directorio
            </Link>
            <Link href="/dashboard?nuevo=true" className="btn-secondary text-base !px-8 !py-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Registrar mi Negocio
            </Link>
          </div>

          {heroLocal && (
            <Link href={`/local/${heroLocal.id}`} className="block mt-16 animate-fade-up stagger-4 max-w-sm mx-auto group">
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-[var(--border)] transition-shadow group-hover:ring-[var(--primary)]/30 group-hover:shadow-lg">
                <img src={JSON.parse(heroLocal.imagenes)[0]} alt="" className="w-full h-32 object-cover transition-all duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-[var(--card-bg)]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-[10px] font-bold">{heroLocal.nombre.charAt(0)}</span>
                  <span className="text-sm font-medium text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors">{heroLocal.nombre}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--fg-muted)] mt-2">Último local agregado</p>
            </Link>
          )}
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-[var(--bg-alt)]/50" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="tag tag-forest mb-4">Categorías</span>
            <h2 className="text-balance">Explora por categoría</h2>
            <p className="text-[var(--fg-muted)] mt-3 max-w-md mx-auto">Encuentra justo lo que buscas entre todos los rubros disponibles</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categorias.map((cat, i) => (
              <Link
                key={cat.nombre}
                href={`/buscar?categoria=${encodeURIComponent(cat.nombre)}`}
                className="group relative bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:border-[var(--primary)]/30 hover:shadow-lg hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${0.05 + i * 0.04}s` }}
              >
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{cat.emoji}</span>
                <span className="text-sm font-medium text-[var(--fg)]">{cat.nombre}</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[var(--primary)] rounded-full transition-all duration-300 group-hover:w-8" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recientes ── */}
      {locales.length > 0 && (
        <section className="py-20 sm:py-28 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="tag tag-terracotta mb-4">Novedades</span>
                <h2>Recién agregados</h2>
                <p className="text-[var(--fg-muted)] mt-2">Los últimos negocios que se unieron al directorio</p>
              </div>
              <Link
                href="/buscar"
                className="btn-ghost text-sm font-medium group"
              >
                Ver todos
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {locales.map((local, i) => {
                const imagenes = local.imagenes ? JSON.parse(local.imagenes) : [];
                const cats = JSON.parse(local.categorias || '[]');
                return (
                  <Link
                    key={local.id}
                    href={`/local/${local.id}`}
                    className="group card overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                  >
                    <div className="relative h-48 overflow-hidden bg-[var(--bg-alt)]">
                      {imagenes.length > 0 ? (
                        <img
                          src={imagenes[0]}
                          alt={local.nombre}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-[var(--muted-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </div>
                      )}
                      {cats.length > 0 && (
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="tag bg-[var(--card-bg)]/90 backdrop-blur-sm text-[var(--fg)] shadow-sm">
                            {cats[0]}
                          </span>
                          {cats.length > 1 && (
                            <span className="tag bg-[var(--card-bg)]/90 backdrop-blur-sm text-[var(--fg-muted)] shadow-sm">
                              +{cats.length - 1}
                            </span>
                          )}
                        </div>
                      )}
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
                      {local.precio && (
                        <p className="text-base font-semibold text-[var(--accent)] mt-3 tracking-tight">
                          {formatearPrecio(local.precio)}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/40" />
                        Hace {Math.floor((Date.now() - new Date(local.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="relative py-28 sm:py-36 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--primary)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[var(--accent)]/20 blur-3xl" />

        <div className="max-w-3xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Comunidad
          </span>
          <h2 className="text-white text-balance mb-4">
            ¿Tienes un negocio local?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
            Regístralo gratis y dale visibilidad a tu emprendimiento en la comunidad
          </p>
          <Link
            href="/dashboard?nuevo=true"
            className="inline-flex items-center gap-2 bg-white text-[var(--primary)] px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/90 transition-all hover:-translate-y-0.5 shadow-xl"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar mi Negocio
          </Link>
        </div>
      </section>
    </div>
  );
}