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

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-wrap gap-1">
            {categorias.slice(0, 2).map((cat: string) => (
              <span key={cat} className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{cat}</span>
            ))}
            {categorias.length > 2 && (
              <span className="text-[10px] text-gray-400">+{categorias.length - 2}</span>
            )}
          </div>
          <button
            onClick={onToggleActive}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${local.activo ? 'bg-green-500' : 'bg-gray-200'}`}
            title={local.activo ? 'Desactivar' : 'Activar'}
            role="switch"
            aria-checked={local.activo}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${local.activo ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <Link href={`/local/${local.id}?from=panel`}>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{local.nombre}</h3>
        </Link>
        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{local.descripcion}</p>
        {items.length > 0 && (
          <div className="space-y-1 mb-3">
            {items.slice(0, 2).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-500">{item.tipo === 'producto' ? '📦' : '🔧'} {item.nombre}</span>
                <span className="font-medium text-gray-700">${item.precio?.toLocaleString('es-CL')}</span>
              </div>
            ))}
            {items.length > 2 && (
              <p className="text-[10px] text-gray-400">+{items.length - 2} más</p>
            )}
          </div>
        )}
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={onEdit} className="flex-1 text-center text-xs text-gray-500 font-medium hover:bg-gray-50 hover:text-blue-600 py-3 transition-colors">✏️ Editar</button>
        <button onClick={onCollaborators} className="flex-1 text-center text-xs text-gray-500 font-medium hover:bg-gray-50 hover:text-green-600 py-3 transition-colors border-x border-gray-100">
          🤝 {local.colaboradoresCount || 0}
        </button>
        <button onClick={onDelete} className="flex-1 text-center text-xs text-gray-500 font-medium hover:bg-gray-50 hover:text-red-600 py-3 transition-colors">🗑️</button>
      </div>
    </div>
  );
}