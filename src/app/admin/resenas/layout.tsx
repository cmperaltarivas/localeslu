import { Suspense } from 'react';

export default function AdminResenasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    }>
      {children}
    </Suspense>
  );
}