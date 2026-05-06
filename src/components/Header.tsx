'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { mostrarToast } from '@/components/Toast';

const ADMIN_EMAIL = 'cmperaltarivas@gmail.com';

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const isLoading = status === 'loading';
  const [scrolled, setScrolled] = useState(false);
  const [pendientes, setPendientes] = useState(0);
  const [notificacionVista, setNotificacionVista] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPendientes = async () => {
    if (status !== 'authenticated' || !session?.user) return;
    try {
      const res = await fetch('/api/notificaciones');
      if (res.ok) {
        const data = await res.json();
        setPendientes(data.total);
        const key = 'notif_vista_' + session.user?.email;
        if (data.total > 0 && !sessionStorage.getItem(key)) {
          mostrarToast(`Tienes ${data.total} ${data.total === 1 ? 'gestión pendiente' : 'gestiones pendientes'} en tu panel`, 'info');
          sessionStorage.setItem(key, '1');
        }
      }
    } catch { }
  };

  useEffect(() => {
    fetchPendientes();
    const handler = () => fetchPendientes();
    window.addEventListener('notificaciones', handler);
    return () => window.removeEventListener('notificaciones', handler);
  }, [status, session]);

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname?.startsWith(basePath + '/');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[var(--card-bg)]/98 backdrop-blur-lg border-b border-[var(--border)] shadow-sm' 
          : 'bg-[var(--card-bg)]/95 backdrop-blur-md border-b border-[var(--border-light)]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[73px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white text-sm shadow-sm group-hover:shadow-[var(--glow-forest)] group-hover:shadow-md transition-all duration-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span className="text-lg font-display font-semibold text-[var(--fg)]">Directorio</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {isLoading ? (
            <div className="w-36 h-9 skeleton rounded-lg" />
          ) : (
            <>
              <Link
                href="/buscar"
                className={`btn-ghost ${isActive('/buscar') ? '!text-[var(--primary)] !bg-[var(--primary)]/8' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Buscar
              </Link>

              <Link
                href="/mapa"
                className={`btn-ghost ${isActive('/mapa') ? '!text-[var(--primary)] !bg-[var(--primary)]/8' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                Mapa
              </Link>

              {session && (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`btn-ghost ${isActive('/admin') ? '!text-[var(--accent)] !bg-[var(--accent)]/8' : ''}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className={`btn-ghost relative ${isActive('/dashboard') ? '!text-[var(--primary)] !bg-[var(--primary)]/8' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Panel
                    {pendientes > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm animate-scale-in">
                        {pendientes > 9 ? '9+' : pendientes}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-24 h-9 skeleton rounded-lg" />
          ) : (
            <>
              {session ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                    <span className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-[11px] font-semibold">
                      {session.user?.name?.charAt(0) || '?'}
                    </span>
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="btn-ghost text-sm hover:!text-red-600 hover:!bg-red-50"
                    title="Cerrar sesión"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="btn-primary !py-2 !px-5 !text-sm"
                >
                  Iniciar sesión
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}