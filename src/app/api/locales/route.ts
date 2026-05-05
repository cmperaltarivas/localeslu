import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const categoria = searchParams.get('categoria');
  const orden = searchParams.get('orden') || 'recientes';

  const where: Record<string, unknown> = { activo: true };

  const locales = await prisma.local.findMany({
    where,
    include: {
      resenas: {
        where: { aprobado: true },
        select: { calificacion: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let filtered = locales;

  if (q && q.trim().length >= 2) {
    const qLower = q.toLowerCase().trim();
    filtered = filtered.filter(local => {
      const texto = `${local.nombre} ${local.descripcion} ${local.categorias} ${local.items ? JSON.parse(local.items).map((i: any) => i.nombre).join(' ') : ''}`.toLowerCase();
      return texto.includes(qLower);
    });
  }

  if (categoria && categoria !== 'Todas') {
    filtered = filtered.filter(local => {
      try {
        const cats = JSON.parse(local.categorias);
        return Array.isArray(cats) && cats.includes(categoria);
      } catch {
        return false;
      }
    });
  }

  const result = filtered.map(local => {
    const resenas = local.resenas;
    const promedio = resenas.length > 0
      ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length
      : 0;
    const { resenas: _, ...rest } = local;
    return { ...rest, rating: Math.round(promedio * 10) / 10, reseñasCount: resenas.length };
  });

  if (orden === 'mejor-evaluado') {
    result.sort((a, b) => b.rating - a.rating);
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'Tu sesión expiró. Cierra sesión e inicia nuevamente.' }, { status: 401 });
    }

    const usuario = await getUsuarioActual(session);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado. Cierra sesión e inicia nuevamente.' }, { status: 404 });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json({ error: 'Datos inválidos. Verifica el formato JSON.' }, { status: 400 });
    }

    if (!data.nombre || data.nombre.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    if (!data.descripcion || data.descripcion.trim().length < 10) {
      return NextResponse.json(
        { error: 'La descripción debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    if (!data.categorias || !Array.isArray(data.categorias) || data.categorias.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos una categoría' },
        { status: 400 }
      );
    }

    let precioPromedio = data.precio ? Number(data.precio) : null;
    
    if (data.items && data.items.length > 0) {
      const itemsWithPrice = data.items.filter((item: { precio?: number }) => item.precio);
      if (itemsWithPrice.length > 0) {
        const totalPrecios = itemsWithPrice.reduce((acc: number, item: { precio: number }) => acc + item.precio, 0);
        precioPromedio = totalPrecios / itemsWithPrice.length;
      }
    }

    if (data.latitud && isNaN(Number(data.latitud))) {
      return NextResponse.json(
        { error: 'La latitud debe ser un número' },
        { status: 400 }
      );
    }

    if (data.longitud && isNaN(Number(data.longitud))) {
      return NextResponse.json(
        { error: 'La longitud debe ser un número' },
        { status: 400 }
      );
    }

    if (data.items && data.items.length > 0) {
      const totalPrecios = data.items.reduce((acc: number, item: { precio?: number }) => 
        item.precio ? acc + item.precio : acc, 0);
      precioPromedio = totalPrecios / data.items.filter((item: { precio?: number }) => item.precio).length || null;
    }

    const local = await prisma.local.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion.trim(),
        categorias: JSON.stringify(data.categorias),
        items: data.items ? JSON.stringify(data.items) : '[]',
        precio: precioPromedio,
        direccion: data.direccion?.trim() || null,
        latitud: data.latitud ? Number(data.latitud) : null,
        longitud: data.longitud ? Number(data.longitud) : null,
        redesSociales: data.redesSociales?.trim() || null,
        sitioWeb: data.sitioWeb?.trim() || null,
        telefono: data.telefono?.trim() || null,
        imagenes: data.imagenes || '[]',
        userId: usuario.id,
      },
    });

    return NextResponse.json(local, { status: 201 });
  } catch (error) {
    console.error('Error al crear local:', error);
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('P2003') || errorMsg.includes('foreign key')) {
      return NextResponse.json(
        { error: 'Tu sesión no es válida. Cierra sesión e inicia nuevamente desde Google.' },
        { status: 500 }
      );
    }
    
    if (errorMsg.includes('P2002') || errorMsg.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un local con ese nombre.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al guardar el local. Intenta en unos segundos.' },
      { status: 500 }
    );
  }
}