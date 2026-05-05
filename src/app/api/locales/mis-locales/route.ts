import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUsuarioActual(session: { user?: { email?: string; id?: string } }) {
  if (!session.user?.email && !session.user?.id) {
    return null;
  }

  if (session.user.email) {
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (usuario) return usuario;
  }

  if (session.user.id) {
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (usuario) return usuario;
  }

  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const locales = await prisma.local.findMany({
      where: { userId: usuario.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { colaboradores: true },
        },
        colaboradores: {
          where: { aprobado: false, rechazado: false, bloqueo: false },
          select: { id: true },
        },
      },
    });

    const result = locales.map(l => ({
      ...l,
      colaboradoresCount: l._count.colaboradores,
      colaboradoresPendientes: l.colaboradores.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener locales' }, { status: 500 });
  }
}