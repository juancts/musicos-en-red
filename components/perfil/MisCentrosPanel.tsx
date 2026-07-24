"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { centroSelect, type CentroMusical } from "@/lib/centro";
import { normalizarCodigoPostal, provinciaDesdeCodigoPostal } from "@/lib/ubicacion";
import {
  esSuscriptorActivo,
  LIMITE_CENTROS_GRATIS,
  obtenerSuscripcion,
} from "@/lib/suscripcion";
import PanelCentro from "@/components/perfil/PanelCentro";

type Props = {
  user: User;
};

type FormNuevoCentro = {
  nombre: string;
  codigo_postal: string;
  bio: string;
};

const formVacio = (): FormNuevoCentro => ({ nombre: "", codigo_postal: "", bio: "" });

export default function MisCentrosPanel({ user }: Props) {
  const [centros, setCentros] = useState<CentroMusical[]>([]);
  const [esSuscriptor, setEsSuscriptor] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [centroActivoId, setCentroActivoId] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);
  const [form, setForm] = useState<FormNuevoCentro>(formVacio);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [{ data }, { estado }] = await Promise.all([
      supabase
        .from("centros")
        .select(centroSelect)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      obtenerSuscripcion(supabase, user.id),
    ]);

    setCentros((data as CentroMusical[] | null) ?? []);
    setEsSuscriptor(esSuscriptorActivo(estado));
    setCargando(false);
  }, [user.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const crearCentro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      setErrorNuevo("Indica el nombre de tu sala.");
      return;
    }

    if (!esSuscriptor && centros.length >= LIMITE_CENTROS_GRATIS) {
      setErrorNuevo(
        `El plan gratuito permite ${LIMITE_CENTROS_GRATIS} sala. Suscríbete para añadir más.`
      );
      return;
    }

    setGuardandoNuevo(true);
    setErrorNuevo(null);

    const provincia = provinciaDesdeCodigoPostal(form.codigo_postal);

    const { data, error } = await supabase
      .from("centros")
      .insert({
        owner_id: user.id,
        nombre: form.nombre.trim(),
        codigo_postal: form.codigo_postal || null,
        provincia: provincia || null,
        ciudad: provincia || null,
        bio: form.bio.trim() || null,
        disponible: true,
      })
      .select(centroSelect)
      .single();

    setGuardandoNuevo(false);

    if (error || !data) {
      setErrorNuevo(
        error?.message.includes("limite_centros_gratis")
          ? `El plan gratuito permite ${LIMITE_CENTROS_GRATIS} sala. Suscríbete para añadir más.`
          : "No pudimos crear tu sala. Inténtalo de nuevo."
      );
      return;
    }

    const nuevoCentro = data as CentroMusical;
    setCentros((prev) => [nuevoCentro, ...prev]);
    setForm(formVacio());
    setCreando(false);
    setCentroActivoId(nuevoCentro.id);
  };

  const centroActivo = centros.find((c) => c.id === centroActivoId) ?? null;

  if (centroActivo) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setCentroActivoId(null)}
          className="mb-6 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 hover:dark:text-gray-200"
        >
          ← Mis salas
        </button>
        <PanelCentro
          user={user}
          centro={centroActivo}
          onCentroActualizado={(actualizado) => {
            setCentros((prev) =>
              prev.map((c) => (c.id === actualizado.id ? actualizado : c))
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Mis salas</h2>
        {!creando &&
          (esSuscriptor || centros.length < LIMITE_CENTROS_GRATIS ? (
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              + Añadir sala
            </button>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Límite del plan gratis — suscríbete para añadir más
            </span>
          ))}
      </div>

      {cargando ? (
        <div className="h-16 rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
      ) : centros.length === 0 && !creando ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Si además de músico gestionas un espacio de ensayo o grabación, puedes
          darlo de alta aquí sin perder tu perfil de músico.
        </p>
      ) : (
        <ul className="space-y-2">
          {centros.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                  {c.nombre || "Sin nombre"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {c.provincia || c.ciudad || "Sin ubicación"}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <Link
                  href={`/musicos/${c.id}`}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Ver ficha
                </Link>
                <button
                  type="button"
                  onClick={() => setCentroActivoId(c.id)}
                  className="text-xs font-medium text-emerald-600 hover:underline"
                >
                  Gestionar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creando && (
        <form onSubmit={crearCentro} className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre de la sala"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <input
            value={form.codigo_postal}
            inputMode="numeric"
            onChange={(e) =>
              setForm({ ...form, codigo_postal: normalizarCodigoPostal(e.target.value) })
            }
            placeholder="Código postal"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Breve descripción"
            rows={2}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm resize-none"
          />
          {errorNuevo && <p className="text-sm text-red-600">{errorNuevo}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCreando(false);
                setForm(formVacio());
                setErrorNuevo(null);
              }}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoNuevo}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {guardandoNuevo ? "Creando..." : "Crear sala"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
