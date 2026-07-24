export const SERVICIOS_CENTRO = [
  "Salas de ensayo",
  "Taller de reparación de instrumentos",
  "Salones y terrazas para eventos",
  "Espacio de coworking",
  "Estudio de grabación",
  "Producción y difusión para bandas",
] as const;

export const COMODIDADES_CENTRO = [
  "Zonas comunes y chill out",
  "Zona para fumadores",
  "Backline del centro",
  "Guarda tu equipo",
  "Carga y descarga 24h",
  "Cámaras de seguridad",
  "Acceso con tarjeta magnética",
] as const;

export const MODELOS_ALQUILER = [
  "Locked — Exclusiva mensual",
  "Unlocked — Packs de horas al mes",
] as const;

export const PACKS_HORAS_MES = [2, 4, 8, 16] as const;

export type PacksUnlocked = Partial<Record<"2" | "4" | "8" | "16", number>>;

export type EspacioEnsayo = {
  id: string;
  centro_id: string;
  nombre: string;
  descripcion: string | null;
  precio_hora: number | null;
  capacidad_max: number | null;
  equipamiento: string[] | null;
  metros_cuadrados: number | null;
  orden: number;
  disponible: boolean;
  created_at?: string;
};

export type CentroMusical = {
  id: string;
  owner_id: string;
  nombre: string | null;
  bio: string | null;
  direccion: string | null;
  telefono: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  horario: string | null;
  disponible: boolean | null;
  servicios: string[] | null;
  comodidades: string[] | null;
  modelos_alquiler: string[] | null;
  packs_unlocked: PacksUnlocked | null;
  precio_locked_mensual: number | null;
  precio_hora: number | null;
  capacidad_max: number | null;
  equipamiento: string[] | null;
  notificar_mensajes_email: boolean | null;
  created_at?: string | null;
};

export const centroSelect =
  "id, owner_id, nombre, bio, direccion, telefono, ciudad, codigo_postal, provincia, horario, disponible, servicios, comodidades, modelos_alquiler, packs_unlocked, precio_locked_mensual, precio_hora, capacidad_max, equipamiento, notificar_mensajes_email, created_at";

export function precioDesdeEspacios(espacios: { precio_hora: number | null; disponible?: boolean }[]) {
  const precios = espacios
    .filter((e) => e.disponible !== false)
    .map((e) => e.precio_hora)
    .filter((p): p is number => p != null && !Number.isNaN(p));

  if (precios.length === 0) return null;
  return Math.min(...precios);
}

export function toggleEnLista(lista: string[], item: string) {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}
