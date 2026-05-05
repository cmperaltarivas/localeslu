import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const usuario = await (async () => {
      if (session.user?.email) return prisma.user.findUnique({ where: { email: session.user.email } });
      if (session.user?.id) return prisma.user.findUnique({ where: { id: session.user.id } });
      return null;
    })();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { localId, calificacion, comentario } = await request.json();

    if (!localId) {
      return NextResponse.json({ error: 'Local requerido' }, { status: 400 });
    }

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json({ error: 'Calificación debe ser entre 1 y 5' }, { status: 400 });
    }

    const local = await prisma.local.findUnique({ where: { id: localId } });
    if (!local) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    if (local.userId === usuario.id) {
      return NextResponse.json({ error: 'No puedes reseñar tu propio local' }, { status: 400 });
    }

    const existente = await prisma.resena.findFirst({
      where: { userId: usuario.id, localId },
    });

    if (existente) {
      return NextResponse.json({ error: 'Ya has enviado una reseña para este local' }, { status: 400 });
    }

    await prisma.resena.create({
      data: {
        calificacion,
        comentario: comentario?.trim() || null,
        localId,
        userId: usuario.id,
      },
    });

    return NextResponse.json({ message: 'Reseña enviada. Será publicada después de ser aprobada.' });
  } catch (error) {
    console.error('Error al crear reseña:', error);
    return NextResponse.json({ error: 'Error al enviar reseña' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const resenas = await prisma.resena.findMany({
      where: { userId },
      include: {
        local: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resenas);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}