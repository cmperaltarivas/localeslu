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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Local no encontrado</p>
          <Link href="/buscar" className="text-blue-600 font-medium hover:underline">Volver al directorio</Link>
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
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
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
          <div className="flex items-center justify-between py-4">
            <BackButton />
            <BotonEditarLocal localId={local.id} />
          </div>
        )}

        {/* Title block */}
        <div className={mainImg ? '-mt-12 relative z-10' : 'pt-2'}>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categorias.map(cat => (
              <span key={cat} className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{cat}</span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{local.nombre}</h1>

          {avg > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.round(avg) ? 'text-yellow-500' : 'text-gray-200'}>★</span>
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{avg.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({resenas.length})</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Sin reseñas aún</p>
          )}
        </div>

        {/* Extra images */}
        {extra.length > 0 && (
          <div className="flex gap-2 mt-6">
            {extra.map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-1/3 h-20 sm:h-28 object-cover rounded-xl ring-1 ring-gray-200" />
            ))}
          </div>
        )}

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {local.direccion && (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-white rounded-full px-3.5 py-2 ring-1 ring-gray-200">
              📍 {local.direccion}
            </span>
          )}
          {local.telefono && (
            <a href={`tel:${local.telefono}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-full px-3.5 py-2 ring-1 ring-blue-200 hover:bg-blue-100 transition-colors">
              📞 {local.telefono}
            </a>
          )}
          {local.sitioWeb && (
            <a href={local.sitioWeb} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-white rounded-full px-3.5 py-2 ring-1 ring-gray-200 hover:bg-gray-100 transition-colors">
              🌐 Web
            </a>
          )}
          {redes.map((r: any, i: number) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-white rounded-full px-3.5 py-2 ring-1 ring-gray-200 hover:bg-gray-100 transition-colors">
              {r.tipo === 'instagram' ? '📷' : r.tipo === 'facebook' ? '📘' : r.tipo === 'tiktok' ? '🎵' : r.tipo === 'whatsapp' ? '💬' : '🔗'} <span className="capitalize">{r.tipo}</span>
            </a>
          ))}
        </div>

        {/* Description */}
        {local.descripcion && (
          <div className="mt-8">
            <h2 className="text-sm font-bold text-gray-700 mb-2">Sobre el negocio</h2>
            <p className="text-gray-600 leading-relaxed max-w-prose whitespace-pre-line">{local.descripcion}</p>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold text-gray-700 mb-2">Servicios y precios</h2>
            <div className="divide-y divide-gray-100 bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.tipo === 'producto' ? '📦' : '🔧'}</span>
                    <span className="text-gray-800">{item.nombre}</span>
                  </div>
                  <span className="font-semibold text-blue-600 tabular-nums">${item.precio?.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {local.latitud && local.longitud && (
          <div className="mt-8">
            <h2 className="text-sm font-bold text-gray-700 mb-2">Ubicación</h2>
            <div className="rounded-xl overflow-hidden ring-1 ring-gray-200">
              <iframe width="100%" height="260" frameBorder="0" scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${local.longitud - 0.01}%2C${local.latitud - 0.01}%2C${local.longitud + 0.01}%2C${local.latitud + 0.01}&layer=mapnik&marker=${local.latitud}%2C${local.longitud}`}
              />
            </div>
          </div>
        )}

        {/* Team + action */}
        <div className="mt-8 py-6 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Equipo</h2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">{local.user.nombre.charAt(0)}</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{local.user.nombre}</p>
                <p className="text-[11px] text-gray-400">Dueño</p>
              </div>
            </div>
            {local.colaboradores.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">{c.usuario.nombre.charAt(0)}</div>
                <div>
                  <p className="text-sm text-gray-700">{c.usuario.nombre}</p>
                  <p className="text-[11px] text-gray-400">Colaborador</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <BotonColaborar localId={local.id} ownerId={local.userId} />
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-8 mb-16">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Reseñas {resenas.length > 0 ? `(${resenas.length})` : ''}</h2>
          <ClientResenas localId={local.id} resenasIniciales={resenas} />
        </div>
      </div>
    </div>
  );
}