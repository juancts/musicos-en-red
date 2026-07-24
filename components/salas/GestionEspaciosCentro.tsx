"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { EspacioEnsayo } from "@/lib/centro";
import { precioDesdeEspacios } from "@/lib/centro";
import { EQUIPAMIENTO_SALA } from "@/lib/usuario";

type FormEspacio = {
  nombre: string;
  descripcion: string;
  precio_hora: string;
  capacidad_max: string;
  metros_cuadrados: string;
  equipamiento: string[];
};

const formVacio = (): FormEspacio => ({
  nombre: "",
  descripcion: "",
  precio_hora: "",
  capacidad_max: "",
  metros_cuadrados: "",
  equipamiento: [],
});

type Props = {
  centroId: string;
};

export default function GestionEspaciosCentro({ centroId }: Props) {
  const [espacios, setEspacios] = useState<EspacioEnsayo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormEspacio>(formVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error: qError } = await supabase
      .from("espacios_ensayo")
      .select("*")
      .eq("centro_id", centroId)
      .order("orden", { ascending: true });

    setCargando(false);
    if (qError) {
      setError("No se pudieron cargar las salas. ¿Ejecutaste 003_centro_multiespacio.sql?");
      return;
    }
    const lista = (data as EspacioEnsayo[]) ?? [];
    setEspacios(lista);

    const min = precioDesdeEspacios(lista);
    if (min != null) {
      await supabase.from("centros").update({ precio_hora: min }).eq("id", centroId);
    }
  }, [centroId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const toggleEquipamiento = (item: string) => {
    setForm((c) => ({
      ...c,
      equipamiento: c.equipamiento.includes(item)
        ? c.equipamiento.filter((x) => x !== item)
        : [...c.equipamiento, item],
    }));
  };

  const resetForm = () => {
    setForm(formVacio());
    setEditandoId(null);
  };

  const editar = (espacio: EspacioEnsayo) => {
    setEditandoId(espacio.id);
    setForm({
      nombre: espacio.nombre,
      descripcion: espacio.descripcion ?? "",
      precio_hora: espacio.precio_hora != null ? String(espacio.precio_hora) : "",
      capacidad_max:
        espacio.capacidad_max != null ? String(espacio.capacidad_max) : "",
      metros_cuadrados:
        espacio.metros_cuadrados != null ? String(espacio.metros_cuadrados) : "",
      equipamiento: espacio.equipamiento ?? [],
    });
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError("Indica el nombre de la sala.");
      return;
    }

    setGuardando(true);
    setError(null);

    const payload = {
      centro_id: centroId,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio_hora: form.precio_hora ? Number(form.precio_hora) : null,
      capacidad_max: form.capacidad_max ? Number(form.capacidad_max) : null,
      metros_cuadrados: form.metros_cuadrados ? Number(form.metros_cuadrados) : null,
      equipamiento: form.equipamiento,
      orden: editandoId
        ? espacios.find((e) => e.id === editandoId)?.orden ?? espacios.length
        : espacios.length,
      disponible: true,
    };

    const { error: saveError } = editandoId
      ? await supabase.from("espacios_ensayo").update(payload).eq("id", editandoId)
      : await supabase.from("espacios_ensayo").insert(payload);

    setGuardando(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    resetForm();
    await cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta sala de ensayo?")) return;
    await supabase.from("espacios_ensayo").delete().eq("id", id);
    if (editandoId === id) resetForm();
    await cargar();
  };

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Salas de ensayo</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Cada local con su precio y equipamiento. El listado muestra el precio más bajo.
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Cargando salas...</p>
      ) : (
        <ul className="space-y-2">
          {espacios.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 dark:border-gray-800 px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{e.nombre}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {e.precio_hora != null ? `${e.precio_hora} €/h` : "—"}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => editar(e)}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(e.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
          {espacios.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">Aún no hay salas. Añade la primera abajo.</p>
          )}
        </ul>
      )}

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {editandoId ? "Editar sala" : "Nueva sala"}
        </p>
        <input
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Ej. Sala A — 25 m²"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
        />
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Descripción breve"
          rows={2}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm resize-none"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            min={0}
            value={form.precio_hora}
            onChange={(e) => setForm({ ...form, precio_hora: e.target.value })}
            placeholder="€/h"
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            value={form.capacidad_max}
            onChange={(e) => setForm({ ...form, capacidad_max: e.target.value })}
            placeholder="Capacidad"
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            value={form.metros_cuadrados}
            onChange={(e) => setForm({ ...form, metros_cuadrados: e.target.value })}
            placeholder="m²"
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPAMIENTO_SALA.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleEquipamiento(item)}
              className={`rounded-full border px-2 py-0.5 text-[10px] ${
                form.equipamiento.includes(item)
                  ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950 text-emerald-700"
                  : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          {editandoId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            disabled={guardando}
            onClick={guardar}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {guardando ? "Guardando..." : editandoId ? "Actualizar sala" : "Añadir sala"}
          </button>
        </div>
      </div>
    </div>
  );
}
