'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { mostrarToast } from '@/components/Toast';
import DropdownSelect from '@/components/DropdownSelect';
import MapPicker from '@/components/MapPicker';

const todasCategorias = [
  'Alimentación', 'Vestimenta', 'Hogar', 'Servicios',
  'Tecnología', 'Salud', 'Educación', 'Entretenimiento',
  'Belleza', 'Deportes', 'Otros',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onActualizar?: () => void;
}

export default function NuevoLocalModal({ isOpen, onClose, onActualizar }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categorias: [] as string[],
    items: [] as { nombre: string; precio: string; tipo: 'producto' | 'servicio' }[],
    direccion: '',
    latitud: '',
    longitud: '',
    redesSociales: '',
    sitioWeb: '',
    telefono: '',
    imagenes: '',
  });

  const scrollAlPrimerError = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const firstError = container.querySelector('[data-error="true"]');
    if (firstError) {
      const offset = firstError.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 24;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      const input = firstError.querySelector('input, textarea');
      if (input) (input as HTMLElement).focus();
    }
  }, []);

  if (!isOpen) return null;

  if (status === 'unauthenticated') {
    router.push('/auth');
    return null;
  }

  const handleSubmitError = (erroresActuales: Record<string, string>) => {
    setErrores(erroresActuales);
    setTimeout(() => scrollAlPrimerError(), 100);
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
    const newErrores: Record<string, string> = {};
    setErrores(newErrores);

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

    if (Object.keys(newErrores).length > 0) {
      handleSubmitError(newErrores);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/locales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categorias: formData.categorias,
          items: formData.items.filter(i => i.nombre.trim()),
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          imagenes: formData.imagenes ? JSON.stringify(formData.imagenes.split(',').map(s => s.trim()).filter(Boolean)) : '[]',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error?.includes('nombre')) {
          setErrores({ nombre: data.error });
        } else {
          mostrarToast(data.error || 'Error al crear', 'error');
        }
        return;
      }

      mostrarToast('¡Local creado exitosamente!', 'success');
      onClose();
      if (onActualizar) onActualizar();
    } catch (error) {
      mostrarToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={scrollRef}
        className="relative bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in"
      >
        <div className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-light)] p-6 flex items-center justify-between rounded-t-xl z-30">
          <h2 className="text-xl font-bold text-[var(--fg)]">Nuevo Local</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div data-error={errores.nombre ? "true" : undefined}>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => {
                setFormData({ ...formData, nombre: e.target.value });
                if (errores.nombre) setErrores({ ...errores, nombre: '' });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all ${
                errores.nombre ? 'border-red-500' : 'border-[var(--border)]'
              }`}
              placeholder="Ej: Panadería Don Juan"
            />
            {errores.nombre && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errores.nombre}
              </p>
            )}
          </div>

          <div data-error={errores.categorias ? "true" : undefined}>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">
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
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--bg)] text-[var(--fg-muted)] hover:bg-[var(--bg-alt)]'
                  }`}
                >
                  {formData.categorias.includes(cat) ? '✓ ' : ''}{cat}
                </button>
              ))}
            </div>
            {errores.categorias && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errores.categorias}
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--fg)]">Productos y Servicios</h3>
              <button
                type="button"
                onClick={agregarItem}
                className="text-sm text-[var(--primary)] hover:underline font-medium"
              >
                + Agregar
              </button>
            </div>
            {formData.items.length === 0 ? (
              <p className="text-[var(--fg-muted)] text-sm">Agrega los productos o servicios que ofreces</p>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <DropdownSelect
                      value={item.tipo}
                      onChange={(v) => actualizarItem(index, 'tipo', v)}
                      options={[{ value: 'producto', label: 'Producto' }, { value: 'servicio', label: 'Servicio' }]}
                      className="w-28"
                    />
                    <input
                      type="text"
                      value={item.nombre}
                      onChange={(e) => actualizarItem(index, 'nombre', e.target.value)}
                      placeholder="Nombre del producto/servicio"
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={item.precio}
                      onChange={(e) => actualizarItem(index, 'precio', e.target.value)}
                      placeholder="Precio"
                      className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
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

          <div data-error={errores.descripcion ? "true" : undefined}>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => {
                setFormData({ ...formData, descripcion: e.target.value });
                if (errores.descripcion) setErrores({ ...errores, descripcion: '' });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all ${
                errores.descripcion ? 'border-red-500' : 'border-[var(--border)]'
              }`}
              rows={3}
              placeholder="Describe tu negocio, productos y servicios..."
            />
            {errores.descripcion && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errores.descripcion}
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="font-semibold text-[var(--fg)] mb-3">📍 Ubicación</h3>
            <p className="text-sm text-[var(--fg-muted)] mb-2">
              {formData.latitud && formData.longitud
                ? 'Haz clic en el mapa para cambiar la ubicación'
                : 'Haz clic en el mapa para seleccionar la ubicación'}
            </p>
            <MapPicker
              latitud={formData.latitud}
              longitud={formData.longitud}
              onPositionChange={(lat, lng) => setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }))}
            />
            {formData.latitud && formData.longitud && (
              <div className="mt-2 p-2 bg-[var(--primary)]/8 rounded-lg text-sm text-[var(--primary)] flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Ubicación seleccionada
                <span className="text-[var(--fg-muted)] ml-auto tabular-nums">
                  ({parseFloat(formData.latitud).toFixed(5)}, {parseFloat(formData.longitud).toFixed(5)})
                </span>
              </div>
            )}
            
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                  placeholder="Ej: Av. Principal 123, La Unión"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">Latitud</label>
                  <input
                    type="text"
                    value={formData.latitud}
                    onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                    placeholder="-40.29531"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">Longitud</label>
                  <input
                    type="text"
                    value={formData.longitud}
                    onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                    placeholder="-73.08211"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="font-semibold text-[var(--fg)] mb-3">📱 Presencia online (opcional)</h3>
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">📷</span>
                <input
                  type="text"
                  value={formData.redesSociales}
                  onChange={(e) => setFormData({ ...formData, redesSociales: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                  placeholder="Instagram, WhatsApp, Facebook, etc."
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">🌐</span>
                <input
                  type="text"
                  value={formData.sitioWeb}
                  onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                  placeholder="https://misitio.cl"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                placeholder="+56912345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--fg-muted)] mb-2">
                Imágenes (URLs)
              </label>
              <input
                type="text"
                value={formData.imagenes}
                onChange={(e) => setFormData({ ...formData, imagenes: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                placeholder="url1.jpg, url2.jpg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg)] text-[var(--fg)] py-3 px-4 rounded-xl font-semibold hover:bg-[var(--bg-alt)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--primary)] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[var(--primary-light)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}