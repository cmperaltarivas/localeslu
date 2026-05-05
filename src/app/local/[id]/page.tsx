import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ClientResenas from '@/components/ClientResenas';
import BackButton from '@/components/BackButton';
import BotonColaborar from '@/components/BotonColaborar';
import BotonEditarLocal from '@/components/BotonEditarLocal';

interface Props { params: Promise<{ id: string }> }

export default async function LocalPage({ params }: Props) {
  const { id } = await params;
  const local = await prisma.local.findUnique({
    where: { id },
    include: {
      user: { select: { nombre: true } },
      colaboradores: { where: { aprobado: true, bloqueo: false }, include: { usuario: { select: { nombre: true } } } },
      resenas: { where: { aprobado: true }, include: { user: { select: { nombre: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!local) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-alt)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <p className="text-[var(--fg-muted)] mb-4">Local no encontrado</p>
          <Link href="/buscar" className="text-[var(--primary)] font-medium hover:underline">Volver al directorio</Link>
        </div>
      </div>
    );
  }

  const imagenes = local.imagenes ? JSON.parse(local.imagenes) : [];
  const categorias = JSON.parse(local.categorias || '[]') as string[];
  const items = JSON.parse(local.items || '[]') as { nombre: string; precio: number; tipo: string }[];
  const resenas = local.resenas;
  const avg = resenas.length > 0 ? resenas.reduce((a, r) => a + r.calificacion, 0) / resenas.length : 0;
  const redes = (() => { try { return JSON.parse(local.redesSociales || '[]'); } catch { return []; } })();
  const mainImg = imagenes[0] || null;
  const extra = imagenes.slice(1, 4);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[var(--bg)]">
      {/* Hero image */}
      {mainImg && (
        <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden">
          <img src={mainImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
            <BackButton />
            <BotonEditarLocal localId={local.id} />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* No image: show back button here */}
        {!mainImg && (
          <div className="flex items-center justify-between py-6">
            <BackButton />
            <BotonEditarLocal localId={local.id} />
          </div>
        )}

        {/* Title block */}
        <div className={mainImg ? '-mt-12 relative z-10' : 'pt-4'}>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categorias.map(cat => (
              <span key={cat} className="tag tag-forest">{cat}</span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--fg)] tracking-tight">{local.nombre}</h1>

          {avg > 0 ? (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.round(avg) ? 'text-amber-400' : 'text-[var(--border)]'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-[var(--fg)]">{avg.toFixed(1)}</span>
              <span className="text-sm text-[var(--fg-muted)]">({resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'})</span>
            </div>
          ) : (
            <p className="text-sm text-[var(--fg-muted)] mt-3">Sin reseñas aún</p>
          )}
        </div>

        {/* Extra images */}
        {extra.length > 0 && (
          <div className="flex gap-2 mt-8">
            {extra.map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-1/3 h-20 sm:h-28 object-cover rounded-lg ring-1 ring-[var(--border-light)]" />
            ))}
          </div>
        )}

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2 mt-8">
          {local.direccion && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] bg-[var(--card-bg)] rounded-full px-4 py-2 ring-1 ring-[var(--border-light)]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {local.direccion}
            </span>
          )}
          {local.telefono && (
            <a href={`tel:${local.telefono}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/8 rounded-full px-4 py-2 ring-1 ring-[var(--primary)]/20 hover:bg-[var(--primary)]/12 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {local.telefono}
            </a>
          )}
          {local.sitioWeb && (
            <a href={local.sitioWeb} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] bg-[var(--card-bg)] rounded-full px-4 py-2 ring-1 ring-[var(--border-light)] hover:bg-[var(--card-hover)] transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Web
            </a>
          )}
          {redes.map((r: any, i: number) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] bg-[var(--card-bg)] rounded-full px-4 py-2 ring-1 ring-[var(--border-light)] hover:bg-[var(--card-hover)] transition-colors">
              {r.tipo === 'instagram' ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              ) : r.tipo === 'facebook' ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              ) : r.tipo === 'tiktok' ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              ) : r.tipo === 'whatsapp' ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              )}
              <span className="capitalize">{r.tipo}</span>
            </a>
          ))}
        </div>

        {/* Description */}
        {local.descripcion && (
          <div className="mt-12">
            <h2 className="text-sm font-bold text-[var(--fg)] mb-3 tracking-wide uppercase">Sobre el negocio</h2>
            <p className="text-[var(--fg-muted)] leading-relaxed max-w-prose whitespace-pre-line text-base">{local.descripcion}</p>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-bold text-[var(--fg)] mb-3 tracking-wide uppercase">Servicios y precios</h2>
            <div className="divide-y divide-[var(--border-light)] bg-[var(--card-bg)] rounded-xl ring-1 ring-[var(--border-light)] overflow-hidden">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--card-hover)]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-base opacity-70">{item.tipo === 'producto' ? '📦' : '🔧'}</span>
                    <span className="text-[var(--fg)]">{item.nombre}</span>
                  </div>
                  <span className="font-semibold text-[var(--accent)] tabular-nums">${item.precio?.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {local.latitud && local.longitud && (
          <div className="mt-12">
            <h2 className="text-sm font-bold text-[var(--fg)] mb-3 tracking-wide uppercase">Ubicación</h2>
            <div className="rounded-xl overflow-hidden ring-1 ring-[var(--border-light)]">
              <iframe width="100%" height="260" className="w-full" frameBorder="0" scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${local.longitud - 0.01}%2C${local.latitud - 0.01}%2C${local.longitud + 0.01}%2C${local.latitud + 0.01}&layer=mapnik&marker=${local.latitud}%2C${local.longitud}`}
                title="Ubicación en mapa"
              />
            </div>
          </div>
        )}

        {/* Team + action */}
        <div className="mt-12 py-8 border-t border-[var(--border-light)]">
          <h2 className="text-sm font-bold text-[var(--fg)] mb-5 tracking-wide uppercase">Equipo</h2>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold">{local.user.nombre.charAt(0)}</div>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">{local.user.nombre}</p>
                <p className="text-xs text-[var(--fg-muted)]">Dueño</p>
              </div>
            </div>
            {local.colaboradores.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] text-sm font-bold">{c.usuario.nombre.charAt(0)}</div>
                <div>
                  <p className="text-sm text-[var(--fg)]">{c.usuario.nombre}</p>
                  <p className="text-xs text-[var(--fg-muted)]">Colaborador</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <BotonColaborar localId={local.id} ownerId={local.userId} />
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12 mb-20">
          <h2 className="text-sm font-bold text-[var(--fg)] mb-4 tracking-wide uppercase">Reseñas {resenas.length > 0 ? `(${resenas.length})` : ''}</h2>
          <ClientResenas localId={local.id} resenasIniciales={resenas} />
        </div>
      </div>
    </div>
  );
}