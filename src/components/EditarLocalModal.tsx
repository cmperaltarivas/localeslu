'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { mostrarToast } from '@/components/Toast';
import { loadGoogleMapsScript } from '@/lib/googleMaps';

const todasCategorias = [
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
  isOpen: boolean;
  onClose: () => void;
  localId: string;
  onActualizar?: () => void;
}

export default function EditarLocalModal({ isOpen, onClose, localId, onActualizar }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const mapRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categorias: [] as string[],
    items: [] as { nombre: string; precio: string; tipo: 'producto' | 'servicio' }[],
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
    if (isOpen && localId) {
      fetchLocal();
    }
  }, [isOpen, localId]);

  const fetchLocal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/locales/${localId}`);
      if (!res.ok) {
        mostrarToast('Error al cargar el local', 'error');
        onClose();
        return;
      }
      const data = await res.json();
      const parsed = {
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        categorias: data.categorias ? JSON.parse(data.categorias) : [],
        items: data.items ? JSON.parse(data.items) : [],
        precio: data.precio?.toString() || '',
        direccion: data.direccion || '',
        latitud: data.latitud?.toString() || '',
        longitud: data.longitud?.toString() || '',
        redesSociales: data.redesSociales || '',
        sitioWeb: data.sitioWeb || '',
        telefono: data.telefono || '',
        imagenes: data.imagenes ? JSON.parse(data.imagenes).join(', ') : '',
        activo: data.activo ?? true,
      };
      setFormData(parsed);
      setOriginalData(parsed);
    } catch (error) {
      mostrarToast('Error de conexión', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !mapRef.current || loading) return;

    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) return;

      const defaultCenter = formData.latitud && formData.longitud
        ? { lat: parseFloat(formData.latitud), lng: parseFloat(formData.longitud) }
        : { lat: -40.29531, lng: -73.08211 }; // La Unión

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: formData.latitud ? 15 : 13,
        clickableIcons: false,
      });

      let marker: any = null;

      if (formData.latitud && formData.longitud) {
        marker = new window.google.maps.Marker({
          position: defaultCenter,
          map,
          draggable: true,
        });

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          setFormData(prev => ({
            ...prev,
            latitud: pos.lat().toString(),
            longitud: pos.lng().toString(),
          }));
        });
      }

      map.addListener('click', (e: any) => {
        if (!e.latLng) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        if (marker) {
          marker.setPosition(e.latLng);
        } else {
          marker = new window.google.maps.Marker({
            position: e.latLng,
            map,
            draggable: true,
          });
        }

        setFormData(prev => ({
          ...prev,
          latitud: lat.toString(),
          longitud: lng.toString(),
        }));
      });
    };

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!API_KEY) return;

    loadGoogleMapsScript(initMap);
  }, [isOpen, loading, formData.latitud, formData.longitud]);

  if (!isOpen) return null;

  if (status === 'unauthenticated') {
    router.push('/auth');
    return null;
  }

  const validar = (): boolean => {
    const newErrores: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrores.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrores.nombre = 'Mínimo 3 caracteres';
    }
    
    if (!formData.descripcion.trim()) {
      newErrores.descripcion = 'La descripción es obligatoria';
    } else if (formData.descripcion.trim().length < 10) {
      newErrores.descripcion = 'Mínimo 10 caracteres';
    }

    if (formData.categorias.length === 0) {
      newErrores.categorias = 'Selecciona al menos una categoría';
    }
    
    if (formData.precio && isNaN(Number(formData.precio))) {
      newErrores.precio = 'Debe ser un número';
    }
    
    setErrores(newErrores);
    return Object.keys(newErrores).length === 0;
  };

  const toggleCategoria = (cat: string) => {
    setFormData(prev => {
      const nuevas = prev.categorias.includes(cat)
        ? prev.categorias.filter(c => c !== cat)
        : [...prev.categorias, cat];
      return { ...prev, categorias: nuevas };
    });
    if (errores.categorias) setErrores({ ...errores, categorias: '' });
  };

  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { nombre: '', precio: '', tipo: 'producto' }]
    }));
  };

  const eliminarItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const actualizarItem = (index: number, campo: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    if (!validar()) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/locales/${localId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categorias: JSON.stringify(formData.categorias),
          items: JSON.stringify(formData.items.filter(i => i.nombre.trim())),
          precio: formData.precio ? parseFloat(formData.precio) : null,
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          imagenes: formData.imagenes ? JSON.stringify(formData.imagenes.split(',').map(s => s.trim()).filter(Boolean)) : '[]',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes('nombre')) {
          setErrores({ nombre: data.error });
        } else if (data.error?.includes('descripción')) {
          setErrores({ descripcion: data.error });
        } else {
          mostrarToast(data.error || 'Error al actualizar', 'error');
        }
        return;
      }

      if (data.sugerencia) {
        mostrarToast('Sugerencia enviada al dueño para aprobación', 'success');
      } else {
        mostrarToast('¡Local actualizado!', 'success');
      }
      onClose();
      if (onActualizar) onActualizar();
    } catch (error) {
      mostrarToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="bg-white rounded-2xl p-8">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  const hayCambios = !originalData || JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl z-30">
          <h2 className="text-xl font-bold text-gray-900">Editar Local</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => {
                setFormData({ ...formData, nombre: e.target.value });
                if (errores.nombre) setErrores({ ...errores, nombre: '' });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.nombre ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Ej: Panadería Don Juan"
            />
            {errores.nombre && (
              <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías *
            </label>
            <div className="flex flex-wrap gap-2">
              {todasCategorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.categorias.includes(cat)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {formData.categorias.includes(cat) ? '✓ ' : ''}{cat}
                </button>
              ))}
            </div>
            {errores.categorias && (
              <p className="text-red-500 text-sm mt-1">{errores.categorias}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Productos y Servicios</h3>
              <button
                type="button"
                onClick={agregarItem}
                className="text-sm text-blue-600 hover:underline"
              >
                + Agregar
              </button>
            </div>
            {formData.items.length === 0 ? (
              <p className="text-gray-400 text-sm">Agrega los productos o servicios que ofreces</p>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={item.tipo}
                      onChange={(e) => actualizarItem(index, 'tipo', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="producto">Producto</option>
                      <option value="servicio">Servicio</option>
                    </select>
                    <input
                      type="text"
                      value={item.nombre}
                      onChange={(e) => actualizarItem(index, 'nombre', e.target.value)}
                      placeholder="Nombre del producto/servicio"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={item.precio}
                      onChange={(e) => actualizarItem(index, 'precio', e.target.value)}
                      placeholder="Precio"
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarItem(index)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
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
                if (errores.descripcion) setErrores({ ...errores, descripcion: '' });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.descripcion ? 'border-red-500' : 'border-gray-200'
              }`}
              rows={3}
              placeholder="Describe tu negocio, productos y servicios..."
            />
            {errores.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errores.descripcion}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">📍 Ubicación</h3>
            <p className="text-sm text-gray-500 mb-2">
              {formData.latitud && formData.longitud 
                ? '✓ Haz clic en el mapa para cambiar la ubicación'
                : 'Haz clic en el mapa para seleccionar la ubicación'}
            </p>
            <div 
              ref={mapRef} 
              className="w-full h-64 rounded-xl border border-gray-200 bg-gray-100"
              style={{ position: 'relative', zIndex: 1 }}
            />
            {formData.latitud && formData.longitud && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                ✓ Ubicación seleccionada
                <span className="ml-2 text-gray-500">
                  ({parseFloat(formData.latitud).toFixed(5)}, {parseFloat(formData.longitud).toFixed(5)})
                </span>
              </div>
            )}
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O escribe la dirección manualmente:
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Av. Principal 123, La Unión"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">📱 Presencia online (opcional)</h3>
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📷</span>
                <input
                  type="text"
                  value={formData.redesSociales}
                  onChange={(e) => setFormData({ ...formData, redesSociales: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instagram, WhatsApp, Facebook, etc."
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🌐</span>
                <input
                  type="text"
                  value={formData.sitioWeb}
                  onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://misitio.cl"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
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
                Imágenes (URLs)
              </label>
              <input
                type="text"
                value={formData.imagenes}
                onChange={(e) => setFormData({ ...formData, imagenes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="url1.jpg, url2.jpg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !hayCambios}
              className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}