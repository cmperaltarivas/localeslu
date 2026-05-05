'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
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

interface Errores {
  nombre?: string;
  descripcion?: string;
  precio?: string;
  imagenes?: string;
}

export default function NuevoLocalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errores, setErrores] = useState<Errores>({});

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
  });

  if (status === 'loading') {
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

  const validar = (): boolean => {
    const newErrores: Errores = {};
    
    if (!formData.nombre.trim()) {
      newErrores.nombre = 'El nombre del local es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.descripcion.trim()) {
      newErrores.descripcion = 'La descripción es obligatoria';
    } else if (formData.descripcion.trim().length < 10) {
      newErrores.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }
    
    if (formData.precio && isNaN(Number(formData.precio))) {
      newErrores.precio = 'El precio debe ser un número';
    }
    
    if (formData.imagenes) {
      const urls = formData.imagenes.split(',').map(s => s.trim()).filter(Boolean);
      const urlsInvalidas = urls.filter(url => !url.startsWith('http://') && !url.startsWith('https://'));
      if (urlsInvalidas.length > 0) {
        newErrores.imagenes = 'Las URLs deben comenzar con http:// o https://';
      }
    }
    
    setErrores(newErrores);
    return Object.keys(newErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrores({});

    if (!validar()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/locales', {
        method: 'POST',
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
        
        if (data.error?.includes('nombre')) {
          setErrores({ nombre: data.error });
          mostrarToast(data.error, 'error');
        } else if (data.error?.includes('descripción')) {
          setErrores({ descripcion: data.error });
          mostrarToast(data.error, 'error');
        } else if (data.error?.includes('URL')) {
          setErrores({ imagenes: data.error });
          mostrarToast(data.error, 'error');
        } else {
          setError(data.error || 'Error al crear el local');
          mostrarToast(data.error || 'Error al crear el local', 'error');
        }
        return;
      }

      setSuccess(true);
      mostrarToast('¡Local creado exitosamente!', 'success');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (error) {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      mostrarToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">
          Nuevo Local o Negocio
        </h1>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-green-700 mb-2">¡Local creado exitosamente!</h2>
            <p className="text-green-600">Serás redirigido a tu panel en unos segundos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 font-medium">⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del local o negocio *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => {
                setFormData({ ...formData, nombre: e.target.value });
                if (errores.nombre) setErrores({ ...errores, nombre: undefined });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.nombre ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Ej: Panadería Don Juan, Barbería Style"
            />
            {errores.nombre && (
              <p className="text-red-500 text-sm mt-1">📝 {errores.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => {
                setFormData({ ...formData, descripcion: e.target.value });
                if (errores.descripcion) setErrores({ ...errores, descripcion: undefined });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.descripcion ? 'border-red-500' : 'border-gray-200'
              }`}
              rows={4}
              placeholder="Describe tu local, productos y servicios..."
            />
            {errores.descripcion && (
              <p className="text-red-500 text-sm mt-1">📝 {errores.descripcion}</p>
            )}
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
              Precio promedio (CLP)
            </label>
            <input
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="25000"
            />
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-bold text-gray-900 mb-4">📍 Dirección (opcional)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Av. Principal 123, Santiago"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="-33.4489"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="-70.6693"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-bold text-gray-900 mb-4">📱 Presencia online (opcional)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redes Sociales
                </label>
                <input
                  type="text"
                  value={formData.redesSociales}
                  onChange={(e) => setFormData({ ...formData, redesSociales: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://misitio.cl"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono de contacto
            </label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+56912345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes - URLs separadas por coma
            </label>
            <input
              type="text"
              value={formData.imagenes}
              onChange={(e) => {
                setFormData({ ...formData, imagenes: e.target.value });
                if (errores.imagenes) setErrores({ ...errores, imagenes: undefined });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.imagenes ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="https://ejemplo.com/img1.jpg, https://ejemplo.com/img2.jpg"
            />
            {errores.imagenes && (
              <p className="text-red-500 text-sm mt-1">📝 {errores.imagenes}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 px-4 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Crear Local'}
          </button>
        </form>
      </div>
    </div>
  );
}