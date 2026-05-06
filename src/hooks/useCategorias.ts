'use client';

import { useState, useEffect } from 'react';

export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  return categorias;
}