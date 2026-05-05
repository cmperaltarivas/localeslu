'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { notFound } from 'next/navigation';
import { mostrarToast } from '@/components/Toast';
import DropdownSelect from '@/components/DropdownSelect';

const categorias = [
  'Alimentación',
  'Vestimenta',
  'Hogar',
  'Servicios',
  'Tecnología',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Belleza',
  'Deportes',
  'Otros',
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditarLocalPage({ params }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [localId, setLocalId] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Servicios',
    precio: '',
    direccion: '',
    latitud: '',
    longitud: '',
    redesSociales: '',
    sitioWeb: '',
    telefono: '',
    imagenes: '',
    activo: true,
  });

  useEffect(() => {
    params.then((p) => {
      setLocalId(p.id);
      fetchLocal(p.id);
    });
  }, [params]);

  const fetchLocal = async (id: string) => {
    try {
      const res = await fetch(`/api/locales/${id}`);
      if (!res.ok) {
        notFound();
      }
      const data = await res.json();
      setFormData({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        categoria: data.categoria || 'Servicios',
        precio: data.precio?.toString() || '',
        direccion: data.direccion || '',
        latitud: data.latitud?.toString() || '',
        longitud: data.longitud?.toString() || '',
        redesSociales: data.redesSociales || '',
        sitioWeb: data.sitioWeb || '',
        telefono: data.telefono || '',
        imagenes: data.imagenes ? JSON.parse(data.imagenes).join(', ') : '',
        activo: data.activo ?? true,
      });
    } catch {
      notFound();
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/locales/${localId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          precio: formData.precio ? parseFloat(formData.precio) : null,
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          imagenes: formData.imagenes ? JSON.stringify(formData.imagenes.split(',').map(s => s.trim()).filter(Boolean)) : '[]',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al actualizar local');
        mostrarToast(data.error || 'Error al actualizar local', 'error');
        return;
      }

      mostrarToast('Local actualizado correctamente', 'success');
      router.push('/dashboard');
    } catch {
      setError('Error al actualizar local');
      mostrarToast('Error al actualizar local', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">
          Editar Local
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del local *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <DropdownSelect
              value={formData.categoria}
              onChange={(v) => setFormData({ ...formData, categoria: v })}
              options={categorias.map(c => ({ value: c, label: c }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio (CLP)
            </label>
            <input
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="20.000"
            />
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-bold text-gray-900 mb-4">📍 Dirección</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitud
                  </label>
                  <input
                    type="text"
                    value={formData.latitud}
                    onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitud
                  </label>
                  <input
                    type="text"
                    value={formData.longitud}
                    onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-bold text-gray-900 mb-4">📱 Presencia online</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redes Sociales
                </label>
                <input
                  type="text"
                  value={formData.redesSociales}
                  onChange={(e) => setFormData({ ...formData, redesSociales: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="@instagram, @tiktok, WhatsApp +56912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio web
                </label>
                <input
                  type="text"
                  value={formData.sitioWeb}
                  onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://misitio.cl"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+56912345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes (URLs separadas por coma)
            </label>
            <input
              type="text"
              value={formData.imagenes}
              onChange={(e) => setFormData({ ...formData, imagenes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <label htmlFor="activo" className="text-gray-700 font-medium">
              Local activo (visible en el directorio)
            </label>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gray-900 text-white py-4 px-4 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}