"use client";

import { useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import type { EspacioEnsayo } from "@/lib/centro";
import { TIPO_MUSICO, TIPO_SALA } from "@/lib/usuario";
import { crearSolicitudReserva } from "@/lib/reservas";

type Props = {
  salaId: string;
  salaNombre: string | null;
  espacios: EspacioEnsayo[];
  ownerId?: string;
};

type Estado = "idle" | "enviando" | "ok" | "error";

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function SolicitarReservaSalaForm({
  salaId,
  salaNombre,
  espacios,
  ownerId,
}: Props) {
  const espaciosDisponibles = useMemo(
    () => espacios.filter((espacio) => espacio.disponible),
    [espacios]
  );
  const [espacioId, setEspacioId] = useState(espaciosDisponibles[0]?.id ?? "");
  const [fecha, setFecha] = useState(hoyISO);
  const [horaInicio, setHoraInicio] = useState("19:00");
  const [duracionHoras, setDuracionHoras] = useState("2");
  const [numMusicos, setNumMusicos] = useState("4");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstado("enviando");
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/login?redirect=/musicos/${salaId}`;
      return;
    }

    if (user.id === salaId || user.id === ownerId) {
      setEstado("error");
      setError("No puedes reservar tu propio centro desde la ficha publica.");
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("usuarios")
      .select("id,tipo,nombre,email")
      .eq("id", user.id)
      .maybeSingle();

    if (perfilError) {
      setEstado("error");
      setError("No pudimos validar tu perfil.");
      return;
    }

    if (!perfil) {
      const { error: insertError } = await supabase.from("usuarios").insert({
        id: user.id,
        tipo: TIPO_MUSICO,
        nombre: user.email?.split("@")[0] ?? "Musico",
        email: user.email,
        disponible: true,
      });

      if (insertError) {
        setEstado("error");
        setError("No pudimos crear tu perfil de musico.");
        return;
      }
    } else if (perfil.tipo === TIPO_SALA) {
      setEstado("error");
      setError("Las solicitudes de reserva se envian desde perfiles de musicos.");
      return;
    }

    const duracion = Number(duracionHoras);
    const cantidad = Number(numMusicos);

    if (!fecha || !horaInicio || duracion <= 0 || cantidad <= 0) {
      setEstado("error");
      setError("Completa fecha, hora, duracion y cantidad de musicos.");
      return;
    }

    const { error: insertError } = await crearSolicitudReserva({
      sala_id: salaId,
      musico_id: user.id,
      espacio_id: espacioId || null,
      fecha,
      hora_inicio: horaInicio,
      duracion_horas: duracion,
      num_musicos: cantidad,
      mensaje: mensaje.trim() || null,
    });

    if (insertError) {
      setEstado("error");
      setError(
        insertError.code === "42P01"
          ? "Falta aplicar la migracion 007_solicitudes_reserva_salas.sql."
          : insertError.message
      );
      return;
    }

    setEstado("ok");
    setMensaje("");
  };

  return (
    <form
      onSubmit={enviar}
      className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5"
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Solicitar ensayo
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Envia una fecha tentativa a {salaNombre || "este centro"}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          Sala
          <select
            value={espacioId}
            onChange={(event) => setEspacioId(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
          >
            {espaciosDisponibles.length === 0 && (
              <option value="">A coordinar</option>
            )}
            {espaciosDisponibles.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          Fecha
          <input
            type="date"
            min={hoyISO()}
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Hora
          <input
            type="time"
            value={horaInicio}
            onChange={(event) => setHoraInicio(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-medium text-gray-700">
            Horas
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={duracionHoras}
              onChange={(event) => setDuracionHoras(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Musicos
            <input
              type="number"
              min={1}
              max={50}
              value={numMusicos}
              onChange={(event) => setNumMusicos(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
            />
          </label>
        </div>
      </div>

      <label className="mt-3 block text-sm font-medium text-gray-700">
        Mensaje
        <textarea
          value={mensaje}
          onChange={(event) => setMensaje(event.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Cuenta el tipo de ensayo, backline necesario o alternativas de horario."
          className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
        />
      </label>

      {error && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {estado === "ok" && (
        <p className="mt-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-700">
          Solicitud enviada. El centro la vera en su perfil.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
