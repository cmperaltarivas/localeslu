import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await (async () => {
      if (session.user?.email) return prisma.user.findUnique({ where: { email: session.user.email } });
      if (session.user?.id) return prisma.user.findUnique({ where: { id: session.user.id } });
      return null;
    })();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const resenas = await prisma.resena.findMany({
      where: {
        aprobado: false,
        local: { userId: usuario.id },
      },
      include: {
        user: { select: { nombre: true, email: true } },
        local: { select: { nombre: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resenas);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
