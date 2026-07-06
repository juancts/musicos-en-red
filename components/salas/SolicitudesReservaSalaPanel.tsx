"use client";

import { useCallback, useEffect, useState } from "react";
import {
  actualizarEstadoSolicitud,
  formatearFechaReserva,
  listarSolicitudesSala,
  normalizarSolicitudReserva,
  normalizarSolicitudesReserva,
  type EstadoSolicitudReserva,
  type SolicitudReservaSala,
} from "@/lib/reservas";

type Props = {
  salaId: string;
};

const estadoStyles: Record<EstadoSolicitudReserva, string> = {
  pendiente: "bg-amber-50 text-amber-700 border-amber-100",
  aceptada: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rechazada: "bg-red-50 text-red-600 border-red-100",
  cancelada: "bg-gray-50 text-gray-500 border-gray-100",
};

export default function SolicitudesReservaSalaPanel({ salaId }: Props) {
  const [solicitudes, setSolicitudes] = useState<SolicitudReservaSala[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const { data, error: queryError } = await listarSolicitudesSala(salaId);

    setCargando(false);

    if (queryError) {
      setError(
        queryError.code === "42P01"
          ? "Falta aplicar la migracion 007_solicitudes_reserva_salas.sql."
          : queryError.message
      );
      return;
    }

    setSolicitudes(normalizarSolicitudesReserva(data));
  }, [salaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const cambiarEstado = async (
    solicitud: SolicitudReservaSala,
    estado: EstadoSolicitudReserva
  ) => {
    setActualizandoId(solicitud.id);
    setError(null);

    const { data, error: updateError } = await actualizarEstadoSolicitud(
      solicitud.id,
      estado
    );

    setActualizandoId(null);

    if (updateError || !data) {
      setError("No pudimos actualizar la solicitud.");
      return;
    }

    setSolicitudes((current) =>
      current.map((item) =>
        item.id === solicitud.id
          ? normalizarSolicitudReserva(data)
          : item
      )
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-900">
            Solicitudes de ensayo
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Reservas tentativas recibidas desde la ficha publica.
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={cargando}
          className="w-fit rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-60"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-gray-400">Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <p className="text-sm text-gray-400">Todavia no hay solicitudes.</p>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((solicitud) => {
            const pendiente = solicitud.estado === "pendiente";
            const ubicacionMusico =
              solicitud.musico?.provincia ||
              solicitud.musico?.codigo_postal ||
              "Zona sin completar";

            return (
              <article
                key={solicitud.id}
                className="rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {solicitud.musico?.nombre ||
                          solicitud.musico?.email ||
                          "Musico"}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${estadoStyles[solicitud.estado]}`}
                      >
                        {solicitud.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {ubicacionMusico}
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {formatearFechaReserva(
                        solicitud.fecha,
                        solicitud.hora_inicio
                      )}
                      <span className="text-gray-400">
                        {" "}
                        · {solicitud.duracion_horas} h ·{" "}
                        {solicitud.num_musicos} musicos
                      </span>
                    </p>
                    {solicitud.espacio?.nombre && (
                      <p className="mt-1 text-xs text-gray-500">
                        Sala: {solicitud.espacio.nombre}
                      </p>
                    )}
                    {solicitud.mensaje && (
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        {solicitud.mensaje}
                      </p>
                    )}
                  </div>

                  {pendiente && (
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={actualizandoId === solicitud.id}
                        onClick={() => cambiarEstado(solicitud, "aceptada")}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        disabled={actualizandoId === solicitud.id}
                        onClick={() => cambiarEstado(solicitud, "rechazada")}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
