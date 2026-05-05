import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'cmperaltarivas@gmail.com';

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

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const existing = await prisma.resena.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
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

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const existing = await prisma.resena.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
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