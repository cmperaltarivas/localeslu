import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL } from '@/lib/constants';

async function getUsuarioActual(session: { user?: { email?: string; id?: string } }) {
  if (!session.user?.email && !session.user?.id) {
    return null;
  }

  if (session.user.email) {
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (usuario) return usuario;
  }

  if (session.user.id) {
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (usuario) return usuario;
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const local = await prisma.local.findUnique({
      where: { id },
      include: {
        user: {
          select: { nombre: true, email: true },
        },
        resenas: {
          include: {
            user: {
              select: { nombre: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!local) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    return NextResponse.json(local);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener local' }, { status: 500 });
  }
}

export async function PUT(
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

    const local = await prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    const esOwner = local.userId === usuario.id;
    const esAdmin = usuario.email === ADMIN_EMAIL;

    const data = await request.json();

    if (esOwner || esAdmin) {
      const updated = await prisma.local.update({
        where: { id },
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          categorias: data.categorias,
          items: data.items,
          precio: data.precio,
          direccion: data.direccion,
          latitud: data.latitud,
          longitud: data.longitud,
          redesSociales: data.redesSociales,
          sitioWeb: data.sitioWeb,
          telefono: data.telefono,
          imagenes: data.imagenes,
          activo: data.activo,
        },
      });

      return NextResponse.json(updated);
    }

    const colaborador = await prisma.colaborador.findFirst({
      where: { usuarioId: usuario.id, localId: id, aprobado: true, bloqueo: false },
    });

    if (colaborador) {
      const cambios: Record<string, any> = {};
      const campos = ['nombre', 'descripcion', 'categorias', 'items', 'precio', 'direccion', 'latitud', 'longitud', 'redesSociales', 'sitioWeb', 'telefono', 'imagenes', 'activo'];
      
      campos.forEach(campo => {
        const original = local[campo as keyof typeof local];
        const nuevo = data[campo];
        if (JSON.stringify(original) !== JSON.stringify(nuevo)) {
          cambios[campo] = nuevo;
        }
      });

      if (Object.keys(cambios).length === 0) {
        return NextResponse.json({ error: 'No se detectaron cambios' }, { status: 400 });
      }

      const edicion = await prisma.edicion.create({
        data: {
          localId: id,
          usuarioId: usuario.id,
          datos: JSON.stringify(cambios),
        },
      });

      return NextResponse.json({ sugerencia: true, mensaje: 'Sugerencia enviada al dueño para aprobación' });
    }

    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar local' }, { status: 500 });
  }
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

    const local = await prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    if (local.userId !== usuario.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.local.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar local' }, { status: 500 });
  }
}