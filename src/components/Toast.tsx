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
    <div className="fixed bottom-6 right-6 z-[110] space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-5 py-3.5 rounded-xl shadow-lg text-white font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center gap-3 min-w-[280px] max-w-sm animate-slide-left ${
            toast.tipo === 'success' ? 'bg-[var(--primary)]' :
            toast.tipo === 'error' ? 'bg-[var(--accent)]' :
            'bg-[var(--fg)]'
          }`}
          onClick={() => eliminarToast(toast.id)}
        >
          {toast.tipo === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : toast.tipo === 'error' ? (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          )}
          <span className="text-sm">{toast.mensaje}</span>
        </div>
      ))}
    </div>
  );
}