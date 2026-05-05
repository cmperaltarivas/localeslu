'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function BackButtonContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');

  if (from === 'panel') {
    return (
      <Link href="/dashboard" className="text-blue-600 font-medium hover:underline inline-block mb-6">
        ← Volver al panel
      </Link>
    );
  }

  if (from === 'admin') {
    return (
      <Link href="/admin" className="text-blue-600 font-medium hover:underline inline-block mb-6">
        ← Volver a administración
      </Link>
    );
  }

  return (
    <Link href="/buscar" className="text-blue-600 font-medium hover:underline inline-block mb-6">
      ← Volver a buscar
    </Link>
  );
}

export default function BackButton() {
  return (
    <Suspense fallback={<Link href="/buscar" className="text-blue-600 font-medium hover:underline inline-block mb-6">← Volver a buscar</Link>}>
      <BackButtonContent />
    </Suspense>
  );
}