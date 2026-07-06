import type { TipoCuenta } from "@/lib/usuario";

export type Partitura = {
  id: string;
  usuario_id: string;
  titulo: string;
  archivo_url: string;
  created_at: string;
};

export type Musico = {
  id: string;
  tipo?: TipoCuenta;
  nombre: string;
  ciudad: string;
  codigo_postal?: string;
  provincia?: string;
  bio: string;
  email?: string;
  telefono?: string;
  contacto_mensajes?: boolean;
  contacto_email_publico?: boolean;
  contacto_telefono_publico?: boolean;
  instrumento?: string;
  generos?: string[];
  avatar_url?: string;
  disponible?: boolean;
};

export type SalaEnsayo = {
  id: string;
  tipo: "sala";
  nombre: string;
  email?: string;
  ciudad: string;
  codigo_postal?: string;
  provincia?: string;
  bio: string;
  direccion?: string;
  telefono?: string;
  precio_hora?: number | null;
  capacidad_max?: number | null;
  equipamiento?: string[];
  horario?: string;
  avatar_url?: string;
  disponible?: boolean;
  servicios?: string[];
  comodidades?: string[];
  modelos_alquiler?: string[];
  packs_unlocked?: Record<string, number>;
  precio_locked_mensual?: number | null;
};

export type UsuarioPerfil = Musico | SalaEnsayo;

export type AuthError = {
  message: string;
};

export type Conversacion = {
  id: string;
  musico_id: string;
  sala_id: string;
  created_at: string;
  updated_at: string;
};

export type Mensaje = {
  id: string;
  conversacion_id: string;
  remitente_id: string;
  cuerpo: string;
  leido: boolean;
  created_at: string;
};

export type {
  AnuncioInstrumento,
  AnuncioConVendedor,
  CategoriaInstrumento,
  CondicionAnuncio,
  EstadoAnuncio,
} from "@/lib/instrumentos";

export type {
  Publicacion,
  PublicacionConAutor,
  TipoPublicacion,
  Comentario,
  ComentarioConAutor,
  MetricasPublicacion,
} from "@/lib/feed";
