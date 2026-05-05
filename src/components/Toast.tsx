'use client';

import { useEffect, useState, useCallback } from 'react';

interface Toast {
  id: number;
  mensaje: string;
  tipo: 'success' | 'error' | 'info';
}

let toastId = 0;

export function mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') {
  const id = ++toastId;
  
  const event = new CustomEvent('mostrarToast', { 
    detail: { id, mensaje, tipo } 
  });
  window.dispatchEvent(event);
  
  sessionStorage.setItem('toast_' + id, JSON.stringify({ id, mensaje, tipo }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const loadStoredToasts = useCallback(() => {
    const stored: Toast[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('toast_')) {
        try {
          stored.push(JSON.parse(sessionStorage.getItem(key) || ''));
        } catch {}
      }
    }
    if (stored.length > 0) {
      setToasts(stored);
    }
  }, []);

  useEffect(() => {
    loadStoredToasts();
  }, [loadStoredToasts]);

  useEffect(() => {
    const handler = (e: CustomEvent<Toast>) => {
      setToasts(prev => {
        const newToasts = [...prev, e.detail];
        sessionStorage.setItem('toast_' + e.detail.id, JSON.stringify(e.detail));
        return newToasts;
      });
      
      setTimeout(() => {
        setToasts(prev => {
          const filtered = prev.filter(t => t.id !== e.detail.id);
          sessionStorage.removeItem('toast_' + e.detail.id);
          return filtered;
        });
      }, 3500);
    };

    window.addEventListener('mostrarToast', handler as EventListener);
    return () => window.removeEventListener('mostrarToast', handler as EventListener);
  }, []);

  const eliminarToast = (id: number) => {
    setToasts(prev => {
      const filtered = prev.filter(t => t.id !== id);
      sessionStorage.removeItem('toast_' + id);
      return filtered;
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-[110] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-6 py-4 rounded-xl shadow-lg text-white font-medium animate-in slide-in-from-right duration-300 cursor-pointer ${
            toast.tipo === 'success' ? 'bg-green-600' :
            toast.tipo === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
          onClick={() => eliminarToast(toast.id)}
        >
          {toast.tipo === 'success' ? '✅' : toast.tipo === 'error' ? '❌' : 'ℹ️'} {toast.mensaje}
        </div>
      ))}
    </div>
  );
}