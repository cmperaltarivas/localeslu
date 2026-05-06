import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORIES = [
  'Alimentación', 'Vestimenta', 'Hogar', 'Servicios', 'Tecnología',
  'Salud', 'Educación', 'Entretenimiento', 'Belleza', 'Deportes', 'Otros',
];

export async function GET() {
  try {
    const count = await prisma.categoria.count();
    if (count === 0) {
      await prisma.categoria.createMany({
        data: DEFAULT_CATEGORIES.map(nombre => ({ nombre })),
      });
    }
    const categorias = await prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
    return NextResponse.json(categorias.map(c => c.nombre));
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { nombre } = await request.json();
    if (!nombre?.trim()) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 });

    const existe = await prisma.categoria.findUnique({ where: { nombre: nombre.trim() } });
    if (existe) return NextResponse.json({ error: 'Ya existe esa categoría' }, { status: 409 });

    await prisma.categoria.create({ data: { nombre: nombre.trim() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email !== 'cmperaltarivas@gmail.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get('nombre');
    if (!nombre) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 });

    await prisma.categoria.delete({ where: { nombre } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}