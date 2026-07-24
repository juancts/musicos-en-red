import Link from "next/link";
import ContactarSalaButton from "@/components/mensajes/ContactarSalaButton";
import CentroDetalleView from "@/components/salas/CentroDetalleView";
import SolicitarReservaSalaForm from "@/components/salas/SolicitarReservaSalaForm";
import AccionesPerfil from "@/components/moderacion/AccionesPerfil";
import BadgeSuscriptor from "@/components/suscripcion/BadgeSuscriptor";
import type { CentroMusical, EspacioEnsayo } from "@/lib/centro";
import { precioDesdeEspacios } from "@/lib/centro";
import { formatearPrecioHora } from "@/lib/usuario";

export type UsuarioSala = CentroMusical & { id: string };

type Props = {
  sala: UsuarioSala;
  espacios: EspacioEnsayo[];
  esSuscriptor?: boolean;
};

export default function PerfilPublicoSala({ sala, espacios, esSuscriptor }: Props) {
  const precioMin =
    precioDesdeEspacios(espacios) ?? sala.precio_hora;
  const precio = formatearPrecioHora(precioMin);
  const numSalas = espacios.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/salas"
        className="text-sm text-gray-400 hover:text-gray-700 inline-flex items-center gap-1 mb-10"
      >
        ← Centros de ensayo
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
          🏢
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-amber-700">
            Centro multiespacio
          </span>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <h1 className="text-xl font-semibold text-gray-900">{sala.nombre}</h1>
            {esSuscriptor && <BadgeSuscriptor />}
            {sala.disponible && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Disponible
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {sala.provincia || sala.ciudad}
            {sala.codigo_postal ? ` · ${sala.codigo_postal}` : ""}
          </p>
          {numSalas > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {numSalas} {numSalas === 1 ? "sala de ensayo" : "salas de ensayo"}
            </p>
          )}
          {precio && (
            <p className="mt-2 text-lg font-semibold text-amber-800">
              Desde {precio}
              <span className="text-sm font-normal text-gray-400"> / hora</span>
            </p>
          )}
          <div className="mt-3">
            <AccionesPerfil usuarioId={sala.owner_id} redirectLogin={`/musicos/${sala.id}`} />
          </div>
        </div>
      </div>

      {sala.direccion && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Ubicación
          </h2>
          <p className="text-sm text-gray-600">{sala.direccion}</p>
        </div>
      )}

      {sala.bio && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Sobre el centro
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {sala.bio}
          </p>
        </div>
      )}

      <CentroDetalleView centro={sala} espacios={espacios} />

      <SolicitarReservaSalaForm
        salaId={sala.id}
        salaNombre={sala.nombre}
        espacios={espacios}
        ownerId={sala.owner_id}
      />

      {sala.horario && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Horario
          </h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{sala.horario}</p>
        </div>
      )}

      <ContactarSalaButton salaId={sala.id} salaNombre={sala.nombre} ownerId={sala.owner_id} />

      {sala.telefono && (
        <div className="border border-gray-100 rounded-2xl p-5 mt-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Teléfono
          </h2>
          <a
            href={`tel:${sala.telefono.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 text-emerald-600 font-medium text-sm hover:underline"
          >
            {sala.telefono}
          </a>
        </div>
      )}
    </div>
  );
}
