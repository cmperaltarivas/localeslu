import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email !== 'cmperaltarivas@gmail.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [totalUsuarios, usuariosActivos, totalLocales, localesActivos, totalResenas, resenasPendientes, totalColaboradores] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { activo: true } }),
      prisma.local.count(),
      prisma.local.count({ where: { activo: true } }),
      prisma.resena.count(),
      prisma.resena.count({ where: { aprobado: false } }),
      prisma.colaborador.count(),
    ]);

    return NextResponse.json({
      totalUsuarios,
      usuariosActivos,
      totalLocales,
      localesActivos,
      totalResenas,
      resenasPendientes,
      totalColaboradores,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}