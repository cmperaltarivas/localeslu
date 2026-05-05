import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUsuarioActual(session: { user?: { email?: string; id?: string } }) {
  if (!session.user?.email && !session.user?.id) return null;
  if (session.user.email) {
    const usuario = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (usuario) return usuario;
  }
  if (session.user.id) {
    const usuario = await prisma.user.findUnique({ where: { id: session.user.id } });
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

    const colaboradorEn = await prisma.colaborador.findMany({
      where: { usuarioId: usuario.id, aprobado: true, bloqueo: false },
      include: { 
        local: {
          include: {
            user: { select: { nombre: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(colaboradorEn);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener colaboraciones' }, { status: 500 });
  }
}