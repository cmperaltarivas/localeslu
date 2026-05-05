export function formatearPrecio(precio: number | null): string {
  if (!precio) return '';
  return precio.toLocaleString('es-CL') + ' CLP';
}