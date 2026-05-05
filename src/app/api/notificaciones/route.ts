import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ total: 0, resenas: 0, colaboradores: 0, ediciones: 0 });
    }

    const usuario = await (async () => {
      if (session.user?.email) return prisma.user.findUnique({ where: { email: session.user.email } });
      if (session.user?.id) return prisma.user.findUnique({ where: { id: session.user.id } });
      return null;
    })();

    if (!usuario) {
      return NextResponse.json({ total: 0, resenas: 0, colaboradores: 0, ediciones: 0 });
    }

    const [resenas, ediciones, locales] = await Promise.all([
      prisma.resena.count({ where: { aprobado: false, local: { userId: usuario.id } } }),
      prisma.edicion.count({ where: { aprobada: false, rechazada: false, local: { userId: usuario.id } } }),
      prisma.local.findMany({ where: { userId: usuario.id }, select: { id: true } }),
    ]);

    const localIds = locales.map(l => l.id);
    const colaboradores = localIds.length > 0
      ? await prisma.colaborador.count({ where: { localId: { in: localIds }, aprobado: false, rechazado: false, bloqueo: false } })
      : 0;

    const total = resenas + ediciones + colaboradores;

    return NextResponse.json({ total, resenas, colaboradores, ediciones });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ total: 0, resenas: 0, colaboradores: 0, ediciones: 0 });
  }
}
