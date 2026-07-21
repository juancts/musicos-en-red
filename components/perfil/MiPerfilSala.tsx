"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  codigoPostalValido,
  normalizarCodigoPostal,
  provinciaDesdeCodigoPostal,
} from "@/lib/ubicacion";
import GestionEspaciosCentro from "@/components/salas/GestionEspaciosCentro";
import SelectorOpciones from "@/components/salas/SelectorOpciones";
import {
  COMODIDADES_CENTRO,
  MODELOS_ALQUILER,
  PACKS_HORAS_MES,
  SERVICIOS_CENTRO,
  toggleEnLista,
  type PacksUnlocked,
} from "@/lib/centro";
import SolicitudesReservaSalaPanel from "@/components/salas/SolicitudesReservaSalaPanel";
import { formatearPrecioHora, perfilSelect } from "@/lib/usuario";
import SuscripcionPanel from "@/components/suscripcion/SuscripcionPanel";

export type PerfilSala = {
  id: string;
  nombre: string | null;
  email: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  bio: string | null;
  direccion: string | null;
  telefono: string | null;
  precio_hora: number | null;
  capacidad_max: number | null;
  equipamiento: string[] | null;
  horario: string | null;
  disponible: boolean | null;
  tipo: string | null;
  servicios: string[] | null;
  comodidades: string[] | null;
  modelos_alquiler: string[] | null;
  packs_unlocked: PacksUnlocked | null;
  precio_locked_mensual: number | null;
  created_at?: string | null;
};

type FormSala = {
  nombre: string;
  direccion: string;
  codigo_postal: string;
  provincia: string;
  bio: string;
  telefono: string;
  horario: string;
  disponible: boolean;
  servicios: string[];
  comodidades: string[];
  modelos_alquiler: string[];
  precio_locked_mensual: string;
  packs: PacksUnlocked;
};

function perfilToForm(perfil: PerfilSala): FormSala {
  return {
    nombre: perfil.nombre ?? "",
    direccion: perfil.direccion ?? "",
    codigo_postal: perfil.codigo_postal ?? "",
    provincia: perfil.provincia ?? "",
    bio: perfil.bio ?? "",
    telefono: perfil.telefono ?? "",
    horario: perfil.horario ?? "",
    disponible: perfil.disponible ?? true,
    servicios: perfil.servicios ?? [],
    comodidades: perfil.comodidades ?? [],
    modelos_alquiler: perfil.modelos_alquiler ?? [],
    precio_locked_mensual:
      perfil.precio_locked_mensual != null
        ? String(perfil.precio_locked_mensual)
        : "",
    packs: perfil.packs_unlocked ?? {},
  };
}

type Props = {
  user: User;
  perfil: PerfilSala;
  onPerfilActualizado: (perfil: PerfilSala) => void;
};

export default function MiPerfilSala({ user, perfil, onPerfilActualizado }: Props) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormSala>(() => perfilToForm(perfil));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    if (form.codigo_postal && !codigoPostalValido(form.codigo_postal)) {
      setError("Código postal español no válido.");
      setGuardando(false);
      return;
    }

    const precioLocked = form.precio_locked_mensual
      ? Number(form.precio_locked_mensual)
      : null;
    const provincia = provinciaDesdeCodigoPostal(form.codigo_postal);
    const packsLimpios = Object.fromEntries(
      Object.entries(form.packs).filter(([, v]) => v != null && v > 0)
    ) as PacksUnlocked;

    const { data, error: updateError } = await supabase
      .from("usuarios")
      .update({
        nombre: form.nombre.trim() || null,
        direccion: form.direccion.trim() || null,
        codigo_postal: form.codigo_postal || null,
        provincia: provincia || null,
        ciudad: provincia || null,
        bio: form.bio.trim() || null,
        telefono: form.telefono.trim() || null,
        horario: form.horario.trim() || null,
        disponible: form.disponible,
        servicios: form.servicios,
        comodidades: form.comodidades,
        modelos_alquiler: form.modelos_alquiler,
        packs_unlocked:
          Object.keys(packsLimpios).length > 0 ? packsLimpios : null,
        precio_locked_mensual: precioLocked,
        email: user.email,
      })
      .eq("id", perfil.id)
      .select(perfilSelect)
      .single();

    setGuardando(false);

    if (updateError || !data) {
      setError("No pudimos guardar los cambios.");
      return;
    }

    const actualizado = data as PerfilSala;
    onPerfilActualizado(actualizado);
    setForm(perfilToForm(actualizado));
    setEditando(false);
  };

  const precioLabel = formatearPrecioHora(perfil.precio_hora);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4">
            Centro multiespacio
          </span>
          <h1 className="text-2xl font-semibold text-gray-900">Mi centro</h1>
          <p className="text-gray-400 text-sm mt-1">
            Varias salas, servicios comunes y modelos Locked / Unlocked
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/musicos/${perfil.id}`}
            className="inline-flex rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300"
          >
            Ver ficha pública
          </Link>
          <Link
            href="/salas"
            className="inline-flex rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300"
          >
            Ver directorio
          </Link>
          <Link
            href="/mensajes"
            className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Mensajes
          </Link>
          {!editando && (
            <button
              type="button"
              onClick={() => {
                setForm(perfilToForm(perfil));
                setEditando(true);
              }}
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Editar centro
            </button>
          )}
        </div>
      </div>

      {editando ? (
        <form onSubmit={guardar} className="space-y-6 max-w-2xl">
          <div className="border border-gray-100 rounded-2xl p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Nombre del centro
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Dirección
              <input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Código postal
              <input
                value={form.codigo_postal}
                inputMode="numeric"
                onChange={(e) => {
                  const cp = normalizarCodigoPostal(e.target.value);
                  setForm({
                    ...form,
                    codigo_postal: cp,
                    provincia: provinciaDesdeCodigoPostal(cp),
                  });
                }}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Descripción del centro
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                maxLength={800}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Horario
              <textarea
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
                rows={2}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm">
              Disponible para alquiler
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) =>
                  setForm({ ...form, disponible: e.target.checked })
                }
                className="h-4 w-4 accent-emerald-600"
              />
            </label>
            <SelectorOpciones
              titulo="Espacios y servicios"
              opciones={SERVICIOS_CENTRO}
              seleccionados={form.servicios}
              onToggle={(item) =>
                setForm((c) => ({ ...c, servicios: toggleEnLista(c.servicios, item) }))
              }
            />
            <SelectorOpciones
              titulo="Instalaciones y comodidades"
              opciones={COMODIDADES_CENTRO}
              seleccionados={form.comodidades}
              onToggle={(item) =>
                setForm((c) => ({
                  ...c,
                  comodidades: toggleEnLista(c.comodidades, item),
                }))
              }
            />
            <SelectorOpciones
              titulo="Modelos de alquiler"
              opciones={MODELOS_ALQUILER}
              seleccionados={form.modelos_alquiler}
              onToggle={(item) =>
                setForm((c) => ({
                  ...c,
                  modelos_alquiler: toggleEnLista(c.modelos_alquiler, item),
                }))
              }
            />
            {form.modelos_alquiler.some((m) => m.startsWith("Locked")) && (
              <label className="block text-sm font-medium text-gray-700">
                Precio exclusiva mensual (€)
                <input
                  type="number"
                  min={0}
                  value={form.precio_locked_mensual}
                  onChange={(e) =>
                    setForm({ ...form, precio_locked_mensual: e.target.value })
                  }
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </label>
            )}
            {form.modelos_alquiler.some((m) => m.startsWith("Unlocked")) && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Packs Unlocked (€ / mes)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PACKS_HORAS_MES.map((h) => (
                    <label key={h} className="text-xs text-gray-600">
                      {h} h/mes
                      <input
                        type="number"
                        min={0}
                        value={form.packs[String(h) as keyof PacksUnlocked] ?? ""}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            packs: {
                              ...c.packs,
                              [String(h)]: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          }))
                        }
                        className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <GestionEspaciosCentro centroId={perfil.id} />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="border border-gray-100 rounded-2xl p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mb-4">
              🏠
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {perfil.nombre || "Sin nombre"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {perfil.provincia || perfil.ciudad || "Sin ubicación"}
            </p>
            {precioLabel && (
              <p className="mt-3 text-lg font-semibold text-amber-800">
                {precioLabel}
                <span className="text-sm font-normal text-gray-400"> / hora</span>
              </p>
            )}
            {perfil.disponible && (
              <span className="inline-block mt-3 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Disponible
              </span>
            )}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm">
              {perfil.direccion && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Dirección</p>
                  <p className="text-gray-700">{perfil.direccion}</p>
                </div>
              )}
              {perfil.telefono && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Teléfono</p>
                  <a
                    href={`tel:${perfil.telefono}`}
                    className="text-emerald-600 hover:underline"
                  >
                    {perfil.telefono}
                  </a>
                </div>
              )}
              {perfil.horario && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Horario</p>
                  <p className="text-gray-700 whitespace-pre-line">{perfil.horario}</p>
                </div>
              )}
            </div>
          </aside>
          <section className="space-y-6">
            <div className="border border-gray-100 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-900">Descripción</h2>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {perfil.bio || "Añade una descripción de tu sala."}
              </p>
            </div>
            {perfil.servicios && perfil.servicios.length > 0 && (
              <div className="border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-gray-900">Servicios</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {perfil.servicios.map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <GestionEspaciosCentro centroId={perfil.id} />
            <SolicitudesReservaSalaPanel salaId={perfil.id} />
            <SuscripcionPanel userId={perfil.id} createdAt={perfil.created_at} />
          </section>
        </div>
      )}
    </div>
  );
}
