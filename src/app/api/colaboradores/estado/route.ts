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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const localId = searchParams.get('localId');

    if (!localId) {
      return NextResponse.json({ error: 'Falta localId' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ estado: 'invitado' });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ estado: 'invitado' });
    }

    const local = await prisma.local.findUnique({ where: { id: localId } });
    if (!local || local.userId === usuario.id) {
      return NextResponse.json({ estado: 'owner' });
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { usuarioId_localId: { usuarioId: usuario.id, localId } },
    });

    if (!colaborador) {
      return NextResponse.json({ estado: 'invitado' });
    }

    if (colaborador.bloqueo) {
      return NextResponse.json({ estado: 'bloqueado' });
    }

    if (colaborador.aprobado) {
      return NextResponse.json({ estado: 'colaborador' });
    }

    return NextResponse.json({ estado: 'pendiente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ estado: 'invitado' });
  }
}