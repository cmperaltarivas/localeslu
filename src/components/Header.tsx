'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

const ADMIN_EMAIL = 'cmperaltarivas@gmail.com';

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const isLoading = status === 'loading';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname?.startsWith(basePath + '/');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/98 backdrop-blur-lg shadow-sm border-b border-gray-200' 
          : 'bg-white/95 backdrop-blur-md border-b border-gray-100'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm shadow-md group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all">🏪</span>
          <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Directorio</span>
        </Link>

        <div className="flex items-center gap-1">
          {isLoading ? (
            <div className="w-32 h-8 bg-gray-100 animate-pulse rounded-lg"></div>
          ) : (
            <>
              <Link href="/buscar" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isActive('/buscar') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                🔍 Buscar
              </Link>

              {session && (
                <>
                  {isAdmin && (
                    <Link href="/admin" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isActive('/admin') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                      ⚙️ Admin
                    </Link>
                  )}
                  <Link href="/dashboard" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                    📋 Panel
                  </Link>
                  <Link href="/dashboard?nuevo=true" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isActive('/dashboard/nuevo') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                    ➕ Nuevo
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-lg"></div>
          ) : (
            <>
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                >
                  🚪 Salir
                </button>
              ) : (
                <Link href="/auth" className="px-6 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Iniciar
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}