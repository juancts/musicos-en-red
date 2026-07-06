import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const BUCKET_ANUNCIOS = "anuncios-instrumentos";

export const CATEGORIAS_INSTRUMENTO = [
  { value: "guitarra", label: "Guitarra" },
  { value: "bajo", label: "Bajo" },
  { value: "bateria", label: "Batería" },
  { value: "teclas", label: "Teclas" },
  { value: "viento", label: "Viento" },
  { value: "cuerda", label: "Cuerda / arco" },
  { value: "amplificacion", label: "Amplificación" },
  { value: "audio", label: "Audio / PA" },
  { value: "otros", label: "Otros" },
] as const;

export const CONDICIONES_ANUNCIO = [
  { value: "nuevo", label: "Nuevo" },
  { value: "como_nuevo", label: "Como nuevo" },
  { value: "buen_estado", label: "Buen estado" },
  { value: "usado", label: "Usado" },
] as const;

export const ESTADOS_ANUNCIO = [
  { value: "activo", label: "Publicado" },
  { value: "pausado", label: "Pausado" },
  { value: "vendido", label: "Vendido" },
] as const;

export type CategoriaInstrumento = (typeof CATEGORIAS_INSTRUMENTO)[number]["value"];
export type CondicionAnuncio = (typeof CONDICIONES_ANUNCIO)[number]["value"];
export type EstadoAnuncio = (typeof ESTADOS_ANUNCIO)[number]["value"];

export type AnuncioInstrumento = {
  id: string;
  vendedor_id: string;
  titulo: string;
  descripcion: string | null;
  categoria: CategoriaInstrumento;
  precio: number;
  condicion: CondicionAnuncio;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  foto_urls: string[];
  estado: EstadoAnuncio;
  created_at: string;
  updated_at: string;
};

export type AnuncioConVendedor = AnuncioInstrumento & {
  vendedor: { id: string; nombre: string | null; provincia: string | null; ciudad: string | null } | null;
};

export const anuncioSelect = `
  id,
  vendedor_id,
  titulo,
  descripcion,
  categoria,
  precio,
  condicion,
  ciudad,
  codigo_postal,
  provincia,
  foto_urls,
  estado,
  created_at,
  updated_at,
  vendedor:usuarios!anuncios_instrumentos_vendedor_id_fkey ( id, nombre, provincia, ciudad )
`;

export function etiquetaCategoria(value: string) {
  return CATEGORIAS_INSTRUMENTO.find((c) => c.value === value)?.label ?? value;
}

const EMOJI_CATEGORIA: Record<string, string> = {
  guitarra: "🎸",
  bajo: "🎸",
  bateria: "🥁",
  teclas: "🎹",
  viento: "🎷",
  cuerda: "🎻",
  amplificacion: "🔊",
  audio: "🎤",
  otros: "🎵",
};

export function emojiCategoria(value: string) {
  return EMOJI_CATEGORIA[value] ?? "🎵";
}

/** URLs verificadas (Unsplash) para datos demo */
export const FOTOS_DEMO = {
  guitarra: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&q=80&auto=format",
  guitarra2: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80&auto=format",
  bajo: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80&auto=format",
  bateria: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format",
  teclas: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800&q=80&auto=format",
  amplificacion: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format",
  audio: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80&auto=format",
  viento: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80&auto=format",
  cuerda: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80&auto=format",
} as const;

export function etiquetaCondicion(value: string) {
  return CONDICIONES_ANUNCIO.find((c) => c.value === value)?.label ?? value;
}

export function etiquetaEstado(value: string) {
  return ESTADOS_ANUNCIO.find((e) => e.value === value)?.label ?? value;
}

export function formatearPrecioAnuncio(precio: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(precio);
}

export function mensajeErrorEsquemaInstrumentos(error: PostgrestError | null) {
  if (!error) return null;

  const msg = error.message.toLowerCase();
  const faltaTabla =
    error.code === "42P01" ||
    msg.includes("anuncios_instrumentos") ||
    msg.includes("does not exist");

  if (faltaTabla) {
    return {
      titulo: "Falta la migración de instrumentos",
      detalle: "Ejecuta 004_instrumentos_marketplace.sql en Supabase → SQL Editor.",
      tecnico: error.message,
    };
  }

  if (msg.includes("bucket") || msg.includes("storage")) {
    return {
      titulo: "Falta el bucket de fotos",
      detalle:
        "Ejecuta 004_instrumentos_marketplace.sql (crea el bucket anuncios-instrumentos) o créalo en Storage.",
      tecnico: error.message,
    };
  }

  return {
    titulo: "Error al cargar anuncios",
    detalle: "Inténtalo de nuevo en unos segundos.",
    tecnico: error.message,
  };
}

export async function subirFotosAnuncio(userId: string, archivos: File[]) {
  const urls: string[] = [];

  for (const file of archivos) {
    const permitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!permitidos.includes(file.type)) {
      return { urls: null, error: { message: "Solo JPG, PNG o WebP." } };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { urls: null, error: { message: "Cada foto debe pesar menos de 5 MB." } };
    }

    const path = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_ANUNCIOS)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      return { urls: null, error: uploadError };
    }

    const { data } = supabase.storage.from(BUCKET_ANUNCIOS).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls, error: null };
}
