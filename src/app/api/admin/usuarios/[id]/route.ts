import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { activo } = await request.json();

    const usuario = await prisma.user.update({
      where: { id },
      data: { activo },
    });

    // También activar/desactivar todos los locales del usuario
    await prisma.local.updateMany({
      where: { userId: id },
      data: { activo },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Eliminar reseñas de locales primero
    await prisma.resena.deleteMany({
      where: { local: { userId: id } },
    });
    await prisma.local.deleteMany({
      where: { userId: id },
    });

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}