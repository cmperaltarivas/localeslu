import Link from 'next/link';

interface Props {
  local: any;
  onEdit: () => void;
  onCollaborators: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export default function LocalCard({ local, onEdit, onCollaborators, onDelete, onToggleActive }: Props) {
  const categorias: string[] = JSON.parse(local.categorias || '[]');
  const items = local.items ? JSON.parse(local.items) : [];
  const pendientes = local.colaboradoresPendientes || 0;

  return (
    <div className="group bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] hover:border-[var(--border)] hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {categorias.slice(0, 2).map((cat: string) => (
              <span key={cat} className="tag tag-forest text-[10px]">{cat}</span>
            ))}
            {categorias.length > 2 && (
              <span className="text-[10px] text-[var(--muted)]">+{categorias.length - 2}</span>
            )}
          </div>
          <button
            onClick={onToggleActive}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${local.activo ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
            title={local.activo ? 'Desactivar' : 'Activar'}
            role="switch"
            aria-checked={local.activo}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${local.activo ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <Link href={`/local/${local.id}?from=panel`}>
          <h3 className="font-semibold text-[var(--fg)] mb-1.5 group-hover:text-[var(--primary)] transition-colors">{local.nombre}</h3>
        </Link>
        <p className="text-sm text-[var(--fg-muted)] line-clamp-2 mb-3 leading-relaxed">{local.descripcion}</p>
        {items.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {items.slice(0, 2).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[var(--fg-muted)] flex items-center gap-1.5">
                  <span className="text-xs opacity-60">{item.tipo === 'producto' ? '📦' : '🔧'}</span>
                  {item.nombre}
                </span>
                <span className="font-medium text-[var(--fg)] tabular-nums">${item.precio?.toLocaleString('es-CL')}</span>
              </div>
            ))}
            {items.length > 2 && (
              <p className="text-xs text-[var(--muted)]">+{items.length - 2} más</p>
            )}
          </div>
        )}
      </div>
      <div className="flex border-t border-[var(--border-light)]">
        <button onClick={onEdit} className="flex-1 text-center text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)] py-3 transition-colors">
          <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button onClick={onCollaborators} className="relative flex-1 text-center text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)] py-3 transition-colors border-x border-[var(--border-light)]">
          <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {local.colaboradoresCount || 0}
          {pendientes > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              {pendientes}
            </span>
          )}
        </button>
        <button onClick={onDelete} className="flex-1 text-center text-xs font-medium text-[var(--fg-muted)] hover:bg-red-50 hover:text-red-600 py-3 transition-colors">
          <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  );
}