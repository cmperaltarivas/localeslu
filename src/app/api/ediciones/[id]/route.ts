import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL } from '@/lib/constants';

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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { edicionId, accion } = await request.json();

    if (!edicionId || !accion) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const edicion = await prisma.edicion.findUnique({
      where: { id: edicionId },
      include: { local: true },
    });

    if (!edicion) {
      return NextResponse.json({ error: 'Edición no encontrada' }, { status: 404 });
    }

    const esOwner = edicion.local.userId === usuario.id;
    const esAdmin = usuario.email === ADMIN_EMAIL;

    if (!esOwner && !esAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (accion === 'aprobar') {
      const datosNuevos = JSON.parse(edicion.datos);
      const camposAString = ['categorias', 'items', 'imagenes'];
      for (const campo of camposAString) {
        if (campo in datosNuevos && Array.isArray(datosNuevos[campo])) {
          datosNuevos[campo] = JSON.stringify(datosNuevos[campo]);
        }
      }
      await prisma.local.update({
        where: { id: edicion.localId },
        data: { ...datosNuevos },
      });

      await prisma.edicion.update({
        where: { id: edicionId },
        data: { aprobada: true, aprobadaAt: new Date() },
      });

      return NextResponse.json({ message: 'Edición aprobada y aplicada' });
    }

    if (accion === 'rechazar') {
      await prisma.edicion.update({
        where: { id: edicionId },
        data: { rechazada: true, rechazadaAt: new Date() },
      });
      return NextResponse.json({ message: 'Edición rechazada' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al gestionar edición' }, { status: 500 });
  }
}