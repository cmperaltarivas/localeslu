import { NextRequest, NextResponse } from 'next/server';
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

    const { localId } = await request.json();

    if (!localId) {
      return NextResponse.json({ error: 'Falta localId' }, { status: 400 });
    }

    const local = await prisma.local.findUnique({ where: { id: localId } });
    if (!local) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    if (local.userId === usuario.id) {
      return NextResponse.json({ error: 'Eres el owner de este local' }, { status: 400 });
    }

    const existente = await prisma.colaborador.findUnique({
      where: { usuarioId_localId: { usuarioId: usuario.id, localId } },
    });

    if (existente) {
      if (existente.bloqueo) {
        return NextResponse.json({ error: 'Has sido bloqueado de este local' }, { status: 400 });
      }
      if (existente.aprobado) {
        return NextResponse.json({ error: 'Ya eres colaborador' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Ya tienes una solicitud pendiente' }, { status: 400 });
    }

    const colaborador = await prisma.colaborador.create({
      data: { usuarioId: usuario.id, localId },
    });

    return NextResponse.json(colaborador);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al solicitar colaboración' }, { status: 500 });
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

    if (localId) {
      const local = await prisma.local.findFirst({
        where: { id: localId, userId: usuario.id },
      });

      if (!local) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      const colaboradores = await prisma.colaborador.findMany({
        where: { localId },
        include: { usuario: true },
      });

      return NextResponse.json(colaboradores);
    }

    const misSolicitudes = await prisma.colaborador.findMany({
      where: { usuarioId: usuario.id },
      include: { local: true },
    });

    const misLocales = await prisma.local.findMany({
      where: { userId: usuario.id },
      include: {
        colaboradores: {
          include: { usuario: true },
        },
      },
    });

    return NextResponse.json({ misSolicitudes, misLocales });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener colaboradores' }, { status: 500 });
  }
}