import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await prisma.user.findFirst({
      where: { OR: [{ email: session.user.email || '' }, { id: session.user.id || '' }] },
    });
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const { localId } = await request.json();
    if (!localId) return NextResponse.json({ error: 'Falta localId' }, { status: 400 });

    const existente = await prisma.favorito.findUnique({
      where: { userId_localId: { userId: usuario.id, localId } },
    });

    if (existente) {
      await prisma.favorito.delete({ where: { id: existente.id } });
      return NextResponse.json({ favorito: false });
    }

    await prisma.favorito.create({ data: { userId: usuario.id, localId } });
    return NextResponse.json({ favorito: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al gestionar favorito' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await prisma.user.findFirst({
      where: { OR: [{ email: session.user.email || '' }, { id: session.user.id || '' }] },
    });
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const favoritos = await prisma.favorito.findMany({
      where: { userId: usuario.id },
      include: { local: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favoritos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener favoritos' }, { status: 500 });
  }
}