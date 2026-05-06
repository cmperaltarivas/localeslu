'use client';

import { useState } from 'react';
import { mostrarToast } from '@/components/Toast';
import { useCategorias } from '@/hooks/useCategorias';

export default function CategoriasManager() {
  const [categorias, setCategoriasLocal] = useState<string[]>([]);
  const [nueva, setNueva] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [catAEliminar, setCatAEliminar] = useState<string | null>(null);

  const categoriasHook = useCategorias();

  // Sync from hook
  useState(() => { if (categoriasHook.length > 0) setCategoriasLocal(categoriasHook); });

  const cats = categorias.length > 0 ? categorias : categoriasHook;

  const agregar = async () => {
    if (!nueva.trim()) return;
    setAgregando(true);
    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nueva.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategoriasLocal(prev => [...prev, nueva.trim()].sort());
        setNueva('');
        mostrarToast('Categoría agregada', 'success');
      } else {
        mostrarToast(data.error || 'Error', 'error');
      }
    } catch {
      mostrarToast('Error de conexión', 'error');
    } finally { setAgregando(false); }
  };

  const eliminar = async () => {
    if (!catAEliminar) return;
    try {
      const res = await fetch(`/api/categorias?nombre=${encodeURIComponent(catAEliminar)}`, { method: 'DELETE' });
      if (res.ok) {
        setCategoriasLocal(prev => prev.filter(c => c !== catAEliminar));
        mostrarToast('Categoría eliminada', 'success');
      } else {
        const data = await res.json();
        mostrarToast(data.error || 'Error', 'error');
      }
    } catch {
      mostrarToast('Error de conexión', 'error');
    } finally { setCatAEliminar(null); }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] shadow-sm p-6 mt-6">
      <h2 className="text-lg font-bold text-[var(--fg)] mb-1">Categorías</h2>
      <p className="text-xs text-[var(--fg-muted)] mb-4">{cats.length} categorías · Agrega o elimina según necesites</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={nueva}
          onChange={e => setNueva(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregar()}
          placeholder="Nueva categoría..."
          className="flex-1 px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        />
        <button
          onClick={agregar}
          disabled={agregando || !nueva.trim()}
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {agregando ? <span className="spinner" /> : 'Agregar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map(cat => (
          <span key={cat} className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-full px-3 py-1.5 text-sm text-[var(--fg)] group">
            {cat}
            <button
              onClick={() => setCatAEliminar(cat)}
              className="text-[var(--fg-muted)] hover:text-red-500 transition-colors ml-0.5 opacity-0 group-hover:opacity-100"
              title="Eliminar categoría"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {catAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
              <h3 className="text-lg font-bold text-gray-900">¿Eliminar categoría?</h3>
              <p className="text-sm text-gray-600 mt-2">
                ¿Eliminar <span className="font-semibold text-gray-700">&quot;{catAEliminar}&quot;</span>? Los locales que la usan no se verán afectados.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCatAEliminar(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={eliminar} className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}