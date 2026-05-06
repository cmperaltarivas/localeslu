'use client';

import { useState, useEffect } from 'react';

export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>([]);

  const fetchCategorias = () => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(setCategorias)
      .catch(() => {});
  };

  useEffect(() => {
    fetchCategorias();
    const handler = () => fetchCategorias();
    window.addEventListener('categorias-updated', handler);
    return () => window.removeEventListener('categorias-updated', handler);
  }, []);

  return categorias;
}

export function notifyCategoriasUpdated() {
  window.dispatchEvent(new CustomEvent('categorias-updated'));
}