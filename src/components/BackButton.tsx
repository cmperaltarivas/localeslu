'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function BackButtonContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');

  if (from === 'panel') {
    return (
      <Link href="/dashboard" className="btn-ghost gap-1.5 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Panel
      </Link>
    );
  }

  if (from === 'admin') {
    return (
      <Link href="/admin" className="btn-ghost gap-1.5 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Admin
      </Link>
    );
  }

  return (
    <Link href="/buscar" className="btn-ghost gap-1.5 text-sm">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      Volver
    </Link>
  );
}

export default function BackButton() {
  return (
    <Suspense fallback={<Link href="/buscar" className="btn-ghost gap-1.5 text-sm"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>Volver</Link>}>
      <BackButtonContent />
    </Suspense>
  );
}