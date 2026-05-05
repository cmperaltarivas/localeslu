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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { localId, datos } = await request.json();

    if (!localId || !datos) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const local = await prisma.local.findUnique({ where: { id: localId } });
    if (!local) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    const esOwner = local.userId === usuario.id;
    const esAdmin = usuario.email === ADMIN_EMAIL;

    if (esOwner || esAdmin) {
      await prisma.local.update({
        where: { id: localId },
        data: JSON.parse(datos),
      });
      return NextResponse.json({ message: 'Actualizado directo' });
    }

    const colaborador = await prisma.colaborador.findFirst({
      where: { usuarioId: usuario.id, localId, aprobado: true, bloqueo: false },
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'No eres colaborador aprobado' }, { status: 403 });
    }

    const edicion = await prisma.edicion.create({
      data: { localId, usuarioId: usuario.id, datos },
    });

    return NextResponse.json(edicion);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al sugerir edición' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
    const localId = searchParams.get('localId');
    const recibidas = searchParams.get('recibidas');

    if (localId) {
      const esOwner = await prisma.local.findFirst({
        where: { id: localId, userId: usuario.id },
      });
      const esAdmin = usuario.email === ADMIN_EMAIL;

      if (!esOwner && !esAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      const ediciones = await prisma.edicion.findMany({
        where: { localId, aprobada: false, rechazada: false },
        include: { usuario: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(ediciones);
    }

    if (recibidas === 'true') {
      const misLocalesIds = await prisma.local.findMany({
        where: { userId: usuario.id },
        select: { id: true },
      });

      const ediciones = await prisma.edicion.findMany({
        where: {
          localId: { in: misLocalesIds.map(l => l.id) },
          aprobada: false,
          rechazada: false,
        },
        include: {
          usuario: true,
          local: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(ediciones);
    }

    const ediciones = await prisma.edicion.findMany({
      where: { 
        usuarioId: usuario.id,
        aprobada: false,
        rechazada: false,
      },
      include: { local: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(ediciones);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener ediciones' }, { status: 500 });
  }
}