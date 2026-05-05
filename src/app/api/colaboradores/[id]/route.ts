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

async function verificarOwner(usuarioId: string, colaboradorId: string) {
  const colaborador = await prisma.colaborador.findUnique({
    where: { id: colaboradorId },
    include: { local: true },
  });
  if (!colaborador) return null;
  const esOwner = colaborador.local.userId === usuarioId;
  return { colaborador, esOwner };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const result = await verificarOwner(usuario.id, id);
    if (!result) return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    if (!result.esOwner && usuario.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.colaborador.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar colaborador' }, { status: 500 });
  }
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

    const { colaboradorId, accion } = await request.json();

    if (!colaboradorId || !accion) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { id: colaboradorId },
      include: { local: true },
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    const esOwner = colaborador.local.userId === usuario.id;
    const esAdmin = usuario.email === ADMIN_EMAIL;

    if (!esOwner && !esAdmin) {
      return NextResponse.json({ error: 'No autorizado para gestionar colaboradores' }, { status: 403 });
    }

    if (accion === 'aprobar') {
      const actualizado = await prisma.colaborador.update({
        where: { id: colaboradorId },
        data: { aprobado: true, aprobadoAt: new Date(), rechazado: false },
      });
      return NextResponse.json(actualizado);
    }

    if (accion === 'rechazar') {
      const actualizado = await prisma.colaborador.update({
        where: { id: colaboradorId },
        data: { rechazado: true, rechazadoAt: new Date() },
      });
      return NextResponse.json(actualizado);
    }

    if (accion === 'bloquear') {
      const actualizado = await prisma.colaborador.update({
        where: { id: colaboradorId },
        data: { bloqueo: true, aprobado: false },
      });
      return NextResponse.json(actualizado);
    }

    if (accion === 'desbloquear') {
      const actualizado = await prisma.colaborador.update({
        where: { id: colaboradorId },
        data: { bloqueo: false },
      });
      return NextResponse.json(actualizado);
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al gestionar colaborador' }, { status: 500 });
  }
}