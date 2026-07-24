"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Partitura } from "@/types";
import {
  codigoPostalValido,
  normalizarCodigoPostal,
  provinciaDesdeCodigoPostal,
} from "@/lib/ubicacion";
import { esSala, perfilSelect, TIPO_MUSICO } from "@/lib/usuario";
import { centroSelect, type CentroMusical } from "@/lib/centro";
import PanelCentro from "@/components/perfil/PanelCentro";
import MisCentrosPanel from "@/components/perfil/MisCentrosPanel";
import MisAnunciosPanel from "@/components/instrumentos/MisAnunciosPanel";
import SuscripcionPanel from "@/components/suscripcion/SuscripcionPanel";

const INSTRUMENTOS = [
  "Guitarrista",
  "Bajista",
  "Vocalista",
  "Batería",
  "Teclista",
  "Productor",
  "Violinista",
  "Saxofonista",
  "Trompetista",
];

const BUSCA = [
  "Unirme a una banda",
  "Buscar músicos",
  "Colaborar online",
  "Sesiones de estudio",
];

const GENEROS = [
  "Rock",
  "Blues",
  "Jazz",
  "Pop",
  "Metal",
  "Funk",
  "Clásica",
  "Electrónica",
  "Hip-hop",
  "Reggae",
  "Flamenco",
  "Indie",
  "Soul",
  "R&B",
];

const AVATAR_BUCKET = "avatars";

type PerfilMusico = {
  id: string;
  tipo?: string | null;
  nombre: string | null;
  email: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  bio: string | null;
  avatar_url: string | null;
  instrumento: string | null;
  busca: string[] | null;
  generos: string[] | null;
  disponible: boolean | null;
  telefono: string | null;
  contacto_mensajes: boolean | null;
  contacto_email_publico: boolean | null;
  contacto_telefono_publico: boolean | null;
  notificar_mensajes_email: boolean | null;
  created_at?: string | null;
};

type FormPerfil = {
  nombre: string;
  ciudad: string;
  codigo_postal: string;
  provincia: string;
  bio: string;
  avatar_url: string;
  instrumento: string;
  busca: string[];
  generos: string[];
  disponible: boolean;
  telefono: string;
  contacto_mensajes: boolean;
  contacto_email_publico: boolean;
  contacto_telefono_publico: boolean;
  notificar_mensajes_email: boolean;
};

type Estado = "cargando" | "sin-sesion" | "sin-perfil" | "error" | "listo";

function perfilToForm(perfil: PerfilMusico): FormPerfil {
  return {
    nombre: perfil.nombre ?? "",
    ciudad: perfil.ciudad ?? "",
    codigo_postal: perfil.codigo_postal ?? "",
    provincia: perfil.provincia ?? "",
    bio: perfil.bio ?? "",
    avatar_url: perfil.avatar_url ?? "",
    instrumento: perfil.instrumento ?? "",
    busca: perfil.busca ?? [],
    generos: perfil.generos ?? [],
    disponible: perfil.disponible ?? true,
    telefono: perfil.telefono ?? "",
    contacto_mensajes: perfil.contacto_mensajes ?? true,
    contacto_email_publico: perfil.contacto_email_publico ?? false,
    contacto_telefono_publico: perfil.contacto_telefono_publico ?? false,
    notificar_mensajes_email: perfil.notificar_mensajes_email ?? true,
  };
}

export default function PerfilPage() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilMusico | null>(null);
  const [miCentro, setMiCentro] = useState<CentroMusical | null>(null);
  const [partituras, setPartituras] = useState<Partitura[]>([]);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const [form, setForm] = useState<FormPerfil>({
    nombre: "",
    ciudad: "",
    codigo_postal: "",
    provincia: "",
    bio: "",
    avatar_url: "",
    instrumento: "",
    busca: [],
    generos: [],
    disponible: true,
    telefono: "",
    contacto_mensajes: true,
    contacto_email_publico: false,
    contacto_telefono_publico: false,
    notificar_mensajes_email: true,
  });

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      setEstado("cargando");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!activo) return;

      if (userError) {
        setEstado("error");
        return;
      }

      if (!user) {
        setUser(null);
        setPerfil(null);
        setEstado("sin-sesion");
        return;
      }

      setUser(user);

      const { data: perfilData, error: perfilError } = await supabase
        .from("usuarios")
        .select(perfilSelect)
        .eq("id", user.id)
        .maybeSingle();

      if (!activo) return;

      if (perfilError) {
        setEstado("error");
        return;
      }

      if (!perfilData) {
        const nombreFallback =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "Mi perfil";
        const avatarFallback =
          user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
        const { data: nuevoPerfil, error: insertError } = await supabase
          .from("usuarios")
          .insert({
            id: user.id,
            tipo: TIPO_MUSICO,
            nombre: nombreFallback,
            email: user.email,
            avatar_url: avatarFallback,
            disponible: true,
          })
          .select(perfilSelect)
          .single();

        if (!activo) return;

        if (insertError || !nuevoPerfil) {
          setPerfil(null);
          setEstado("sin-perfil");
          return;
        }

        const perfilCreado = nuevoPerfil as PerfilMusico;
        setPerfil(perfilCreado);
        setForm(perfilToForm(perfilCreado));
        setPartituras([]);
        setEstado("listo");
        return;
      }

      const perfilActual = perfilData as PerfilMusico;
      setPerfil(perfilActual);
      setForm(perfilToForm(perfilActual));

      if (esSala(perfilActual)) {
        const { data: centroData } = await supabase
          .from("centros")
          .select(centroSelect)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!activo) return;

        setMiCentro((centroData as CentroMusical | null) ?? null);
        setEstado("listo");
        return;
      }

      const { data: partiturasData } = await supabase
        .from("partituras")
        .select("id, usuario_id, titulo, archivo_url, created_at")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (!activo) return;

      setPartituras((partiturasData as Partitura[] | null) ?? []);
      setEstado("listo");
    }

    cargarPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      cargarPerfil();
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const activarEdicion = () => {
    if (!perfil) return;
    setForm(perfilToForm(perfil));
    setErrorEdicion(null);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    if (perfil) setForm(perfilToForm(perfil));
    setErrorEdicion(null);
    setEditando(false);
  };

  const toggleArrayValue = (field: "busca" | "generos", value: string) => {
    setForm((current) => {
      const values = current[field];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return { ...current, [field]: nextValues };
    });
  };

  const guardarPerfil = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!perfil || !user) return;

    setGuardando(true);
    setErrorEdicion(null);

    if (form.codigo_postal && !codigoPostalValido(form.codigo_postal)) {
      setGuardando(false);
      setErrorEdicion("Introduce un código postal español válido.");
      return;
    }

    const provincia = provinciaDesdeCodigoPostal(form.codigo_postal);

    const { data, error } = await supabase
      .from("usuarios")
      .update({
        nombre: form.nombre.trim() || null,
        ciudad: provincia || form.ciudad.trim() || null,
        codigo_postal: form.codigo_postal || null,
        provincia: provincia || null,
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        instrumento: form.instrumento || null,
        busca: form.busca,
        generos: form.generos,
        disponible: form.disponible,
        telefono: form.telefono.trim() || null,
        contacto_mensajes: form.contacto_mensajes,
        contacto_email_publico: form.contacto_email_publico,
        contacto_telefono_publico: form.contacto_telefono_publico,
        notificar_mensajes_email: form.notificar_mensajes_email,
        email: user.email,
      })
      .eq("id", perfil.id)
      .select(perfilSelect)
      .single();

    setGuardando(false);

    if (error || !data) {
      setErrorEdicion("No pudimos guardar los cambios. Inténtalo de nuevo.");
      return;
    }

    const perfilActualizado = data as PerfilMusico;
    setPerfil(perfilActualizado);
    setForm(perfilToForm(perfilActualizado));
    setEditando(false);
  };

  if (estado === "cargando") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="h-6 w-24 rounded-lg bg-gray-100 dark:bg-gray-800 mb-4" />
          <div className="h-8 w-36 rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 mt-3" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-64 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50" />
          <div className="space-y-3">
            <div className="h-32 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50" />
            <div className="h-24 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50" />
          </div>
        </div>
      </div>
    );
  }

  if (estado === "sin-sesion") {
    return (
      <EstadoVacio
        title="Inicia sesión para ver tu perfil"
        text="Tu perfil se carga con los datos asociados a tu cuenta de Supabase."
        actionHref="/login"
        actionText="Entrar"
      />
    );
  }

  if (estado === "sin-perfil") {
    return (
      <EstadoVacio
        title="No encontramos tu perfil musical"
        text="Hay una sesión activa, pero todavía no existe una fila asociada en la tabla usuarios."
        actionHref="/registro"
        actionText="Completar registro"
      />
    );
  }

  if (estado === "error" || !perfil || !user) {
    return (
      <EstadoVacio
        title="No pudimos cargar tu perfil"
        text="Revisa la conexión con Supabase o inténtalo de nuevo en unos segundos."
        actionHref="/"
        actionText="Volver al inicio"
      />
    );
  }

  if (esSala(perfil)) {
    if (!miCentro) {
      return (
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="h-64 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50" />
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <PanelCentro user={user} centro={miCentro} onCentroActualizado={setMiCentro} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full mb-4">
            Mi espacio musical
          </span>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Mi perfil</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Datos cargados desde tu cuenta de Supabase
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/musicos/${perfil.id}`}
            className="inline-flex w-fit items-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:border-gray-300 hover:dark:border-gray-600"
          >
            Ver perfil público
          </Link>
          {!editando && (
            <button
              type="button"
              onClick={activarEdicion}
              className="inline-flex w-fit items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Editar perfil
            </button>
          )}
        </div>
      </div>

      {editando ? (
        <EditarPerfil
          form={form}
          setForm={setForm}
          userId={user.id}
          userEmail={user.email ?? "Sin email"}
          guardando={guardando}
          error={errorEdicion}
          onSubmit={guardarPerfil}
          onCancel={cancelarEdicion}
          onToggleArrayValue={toggleArrayValue}
        />
      ) : (
        <VistaPerfil user={user} perfil={perfil} partituras={partituras} />
      )}
    </div>
  );
}

function VistaPerfil({
  user,
  perfil,
  partituras,
}: {
  user: User;
  perfil: PerfilMusico;
  partituras: Partitura[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Avatar perfil={perfil} fallback={user.email ?? "?"} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                {perfil.nombre || "Sin nombre"}
              </h2>
              {perfil.disponible && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  Disponible
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {perfil.instrumento || "Instrumento sin completar"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {perfil.provincia || perfil.ciudad || "Zona sin completar"}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-6 text-sm">
          <Info label="Email de sesión" value={user.email ?? "Sin email"} />
          <Info
            label="Código postal"
            value={perfil.codigo_postal ?? "Sin código postal"}
          />
          <Info
            label="Contacto"
            value={
              [
                perfil.contacto_mensajes ? "Mensajes" : null,
                perfil.contacto_email_publico ? "Email" : null,
                perfil.contacto_telefono_publico ? "Telefono" : null,
              ]
                .filter(Boolean)
                .join(", ") || "Sin vias publicas"
            }
          />
          <Info label="ID de usuario" value={user.id} />
          {perfil.created_at && (
            <Info
              label="Perfil creado"
              value={new Date(perfil.created_at).toLocaleDateString("es-ES")}
            />
          )}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Sobre mí</h2>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {perfil.bio || "Todavía no agregaste una bio a tu perfil."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Partituras" value={String(partituras.length)} />
          <Stat label="Géneros" value={String(perfil.generos?.length ?? 0)} />
          <Stat label="Objetivos" value={String(perfil.busca?.length ?? 0)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TagPanel title="Géneros" items={perfil.generos ?? []} empty="Sin géneros cargados" />
          <TagPanel title="Qué busco" items={perfil.busca ?? []} empty="Sin objetivos cargados" />
        </div>

        <PartiturasPanel partituras={partituras} />

        <SuscripcionPanel userId={user.id} />

        <MisCentrosPanel user={user} />

        <MisAnunciosPanel userId={user.id} />
      </section>
    </div>
  );
}

function EditarPerfil({
  form,
  setForm,
  userId,
  userEmail,
  guardando,
  error,
  onSubmit,
  onCancel,
  onToggleArrayValue,
}: {
  form: FormPerfil;
  setForm: React.Dispatch<React.SetStateAction<FormPerfil>>;
  userId: string;
  userEmail: string;
  guardando: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onToggleArrayValue: (field: "busca" | "generos", value: string) => void;
}) {
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState<string | null>(null);

  const subirAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorAvatar(null);

    if (!file.type.startsWith("image/")) {
      setErrorAvatar("Selecciona una imagen valida.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorAvatar("La imagen no puede superar 2 MB.");
      event.target.value = "";
      return;
    }

    setSubiendoAvatar(true);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setSubiendoAvatar(false);
    event.target.value = "";

    if (uploadError) {
      setErrorAvatar(
        "No pudimos subir el avatar. Revisa que este aplicada la migracion 010_avatar_storage.sql."
      );
      return;
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    setForm((current) => ({ ...current, avatar_url: data.publicUrl }));
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Nombre artístico
          </label>
          <input
            value={form.nombre}
            onChange={(event) =>
              setForm((current) => ({ ...current, nombre: event.target.value }))
            }
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Código postal
          </label>
          <input
            value={form.codigo_postal}
            inputMode="numeric"
            onChange={(event) => {
              const codigoPostal = normalizarCodigoPostal(event.target.value);
              const provincia = provinciaDesdeCodigoPostal(codigoPostal);
              setForm((current) => ({
                ...current,
                codigo_postal: codigoPostal,
                provincia,
                ciudad: provincia,
              }));
            }}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            placeholder="28001"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {form.provincia
              ? `Zona detectada: ${form.provincia}`
              : "Se usará para buscar músicos cercanos."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Instrumento
          </label>
          <select
            value={form.instrumento}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                instrumento: event.target.value,
              }))
            }
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="">Selecciona uno</option>
            {INSTRUMENTOS.map((instrumento) => (
              <option key={instrumento} value={instrumento}>
                {instrumento}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Disponibilidad
          </p>
          <label className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 text-sm text-gray-600 dark:text-gray-300">
            Disponible para contactar
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  disponible: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-emerald-600"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Telefono de contacto
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  telefono: event.target.value,
                }))
              }
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Vias visibles
            </p>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                Mensaje en la app
                <input
                  type="checkbox"
                  checked={form.contacto_mensajes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contacto_mensajes: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                Mostrar email
                <input
                  type="checkbox"
                  checked={form.contacto_email_publico}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contacto_email_publico: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                Mostrar telefono
                <input
                  type="checkbox"
                  checked={form.contacto_telefono_publico}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contacto_telefono_publico: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
              </label>
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 text-sm text-gray-600 dark:text-gray-300">
            Avisarme por email si recibo un mensaje
            <input
              type="checkbox"
              checked={form.notificar_mensajes_email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notificar_mensajes_email: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-emerald-600"
            />
          </label>
        </div>

        <Info label="Email de sesión" value={userEmail} />
      </aside>

      <section className="space-y-6">
        <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">
            Sobre mí
          </label>
          <textarea
            value={form.bio}
            onChange={(event) =>
              setForm((current) => ({ ...current, bio: event.target.value }))
            }
            rows={4}
            maxLength={280}
            className="w-full resize-none border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            placeholder="Cuenta qué tocas, qué buscas y qué tipo de proyectos te interesan..."
          />
          <p className="mt-2 text-right text-xs text-gray-300 dark:text-gray-600">
            {form.bio.length} / 280
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <EditableTagPanel
            title="Géneros"
            options={GENEROS}
            selected={form.generos}
            onToggle={(value) => onToggleArrayValue("generos", value)}
          />
          <EditableTagPanel
            title="Qué busco"
            options={BUSCA}
            selected={form.busca}
            onToggle={(value) => onToggleArrayValue("busca", value)}
          />
        </div>

        <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Avatar</h2>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Sube una imagen cuadrada o pega una URL publica.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:border-gray-300 hover:dark:border-gray-600">
              {subiendoAvatar ? "Subiendo..." : "Subir imagen"}
              <input
                type="file"
                accept="image/*"
                onChange={subirAvatar}
                disabled={subiendoAvatar}
                className="sr-only"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {form.avatar_url ? (
              <div
                aria-label="Vista previa del avatar"
                className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 bg-cover bg-center"
                style={{ backgroundImage: `url(${form.avatar_url})` }}
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-xl font-bold text-emerald-700">
                {(form.nombre || userEmail).charAt(0).toUpperCase()}
              </div>
            )}
            <input
              type="url"
              value={form.avatar_url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  avatar_url: event.target.value,
                }))
              }
              className="min-w-0 flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="https://..."
            />
          </div>

          {errorAvatar && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {errorAvatar}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={guardando}
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:border-gray-300 hover:dark:border-gray-600 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </section>
    </form>
  );
}

function Avatar({
  perfil,
  fallback,
}: {
  perfil: PerfilMusico;
  fallback: string;
}) {
  if (perfil.avatar_url) {
    return (
      <div
        aria-label="Avatar del perfil"
        className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: `url(${perfil.avatar_url})` }}
      />
    );
  }

  return (
    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
      {(perfil.nombre || fallback).charAt(0).toUpperCase()}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-all">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}

function TagPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">{empty}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableTagPanel({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950 text-emerald-700"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:dark:border-gray-600"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PartiturasPanel({ partituras }: { partituras: Partitura[] }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Partituras subidas</h2>
      {partituras.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
          Todavía no subiste partituras.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {partituras.map((partitura) => (
            <a
              key={partitura.id}
              href={partitura.archivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 text-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 hover:dark:bg-emerald-950/40"
            >
              <span className="font-medium text-gray-800 dark:text-gray-100">
                {partitura.titulo}
              </span>
              <span className="text-xs text-emerald-600">Ver →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoVacio({
  title,
  text,
  actionHref,
  actionText,
}: {
  title: string;
  text: string;
  actionHref: string;
  actionText: string;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 flex items-center justify-center mx-auto mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400 dark:text-gray-500">{text}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        {actionText}
      </Link>
    </div>
  );
}
