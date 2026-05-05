import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'cmperaltarivas@gmail.com';

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

async function esOwnerDeResena(resenaId: string, usuarioId: string): Promise<boolean> {
  const resena = await prisma.resena.findUnique({
    where: { id: resenaId },
    include: { local: { select: { userId: true } } },
  });
  return resena?.local.userId === usuarioId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pendientes = searchParams.get('pendientes');
    const todas = searchParams.get('todas');
    const userId = searchParams.get('userId');

    const where: Record<string, boolean> = {};
    
    if (pendientes === 'true') {
      where.aprobado = false;
    } else if (todas === 'true') {
      where.aprobado = true;
    }

    const resenas = await prisma.resena.findMany({
      where,
      include: {
        user: {
          select: { nombre: true, email: true },
        },
        local: {
          select: { nombre: true, id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resenas);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const esAdmin = usuario.email === ADMIN_EMAIL;
    const esOwner = await esOwnerDeResena(data.id, usuario.id);

    if (!esAdmin && !esOwner) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resena = await prisma.resena.update({
      where: { id: data.id },
      data: { aprobado: data.aprobado },
    });

    return NextResponse.json(resena);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const esAdmin = usuario.email === ADMIN_EMAIL;
    const esOwner = await esOwnerDeResena(id, usuario.id);

    if (!esAdmin && !esOwner) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.resena.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reseña eliminada' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}