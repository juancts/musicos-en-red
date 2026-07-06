export type TipoCuenta = "musico" | "sala";

export const TIPO_MUSICO: TipoCuenta = "musico";
export const TIPO_SALA: TipoCuenta = "sala";

export const EQUIPAMIENTO_SALA = [
  "Batería completa",
  "Amplificador guitarra",
  "Amplificador bajo",
  "PA / microfonía",
  "Cabina de grabación",
  "Teclado / piano",
  "Aire acondicionado",
  "Parking",
] as const;

export const perfilSelect =
  "id, nombre, email, tipo, ciudad, codigo_postal, provincia, bio, avatar_url, instrumento, busca, generos, disponible, direccion, telefono, precio_hora, capacidad_max, equipamiento, horario, servicios, comodidades, modelos_alquiler, packs_unlocked, precio_locked_mensual, created_at";

export function esSala(perfil: { tipo?: string | null }) {
  return perfil.tipo === TIPO_SALA;
}

export function esMusico(perfil: { tipo?: string | null }) {
  return !perfil.tipo || perfil.tipo === TIPO_MUSICO;
}

export function formatearPrecioHora(precio: number | null | undefined) {
  if (precio == null || Number.isNaN(precio)) return null;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(precio);
}
