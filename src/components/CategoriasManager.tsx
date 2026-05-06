'use client';

import { useState, useEffect } from 'react';
import { mostrarToast } from '@/components/Toast';
import { useCategorias } from '@/hooks/useCategorias';

export default function CategoriasManager() {
  const categorias = useCategorias();
  const [nueva, setNueva] = useState('');
  const [agregando, setAgregando] = useState(false);

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
        setNueva('');
        mostrarToast('Categoría agregada', 'success');
        window.location.reload();
      } else {
        mostrarToast(data.error || 'Error', 'error');
      }
    } catch {
      mostrarToast('Error de conexión', 'error');
    } finally { setAgregando(false); }
  };

  const eliminar = async (nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    try {
      const res = await fetch(`/api/categorias?nombre=${encodeURIComponent(nombre)}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarToast('Categoría eliminada', 'success');
        window.location.reload();
      } else {
        const data = await res.json();
        mostrarToast(data.error || 'Error', 'error');
      }
    } catch {
      mostrarToast('Error de conexión', 'error');
    }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-light)] shadow-sm p-6 mt-6">
      <h2 className="text-lg font-bold text-[var(--fg)] mb-1">Categorías</h2>
      <p className="text-xs text-[var(--fg-muted)] mb-4">{categorias.length} categorías · Agrega o elimina según necesites</p>

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
        {categorias.map(cat => (
          <span key={cat} className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-full px-3 py-1.5 text-sm text-[var(--fg)] group">
            {cat}
            <button
              onClick={() => eliminar(cat)}
              className="text-[var(--fg-muted)] hover:text-red-500 transition-colors ml-0.5 opacity-0 group-hover:opacity-100"
              title="Eliminar categoría"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}