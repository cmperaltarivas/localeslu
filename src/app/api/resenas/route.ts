import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const resenas = await prisma.resena.findMany({
      where: { userId },
      include: {
        local: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resenas);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}