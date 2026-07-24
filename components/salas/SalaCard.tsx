import Link from "next/link";
import { precioDesdeEspacios } from "@/lib/centro";
import type { EspacioEnsayo } from "@/lib/centro";
import { formatearPrecioHora } from "@/lib/usuario";
import BadgeSuscriptor from "@/components/suscripcion/BadgeSuscriptor";

export type SalaListItem = {
  id: string;
  owner_id: string;
  nombre: string | null;
  provincia: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  bio: string | null;
  precio_hora: number | null;
  capacidad_max: number | null;
  equipamiento: string[] | null;
  disponible: boolean | null;
  servicios: string[] | null;
  espacios_ensayo?: Pick<EspacioEnsayo, "id" | "precio_hora" | "disponible" | "nombre">[] | null;
  created_at: string | null;
};

type Props = {
  sala: SalaListItem;
  cerca?: boolean;
  esSuscriptor?: boolean;
};

export default function SalaCard({ sala, cerca, esSuscriptor }: Props) {
  const espacios = sala.espacios_ensayo ?? [];
  const precioMin = precioDesdeEspacios(espacios) ?? sala.precio_hora;
  const precio = formatearPrecioHora(precioMin);
  const numSalas = espacios.length;

  return (
    <Link
      href={`/musicos/${sala.id}`}
      className="group block border border-gray-100 rounded-2xl p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
          🏢
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 text-sm truncate group-hover:text-emerald-700">
            {sala.nombre || "Centro sin nombre"}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {sala.provincia || sala.ciudad || "Sin ubicación"}
            {sala.codigo_postal ? ` · ${sala.codigo_postal}` : ""}
          </p>
        </div>
        {esSuscriptor && <BadgeSuscriptor />}
        {cerca && (
          <span className="flex-shrink-0 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Cerca
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {numSalas > 0 && (
          <span className="text-xs text-gray-600 bg-gray-50 px-2.5 py-0.5 rounded-full">
            {numSalas} {numSalas === 1 ? "sala" : "salas"}
          </span>
        )}
        {precio && (
          <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
            Desde {precio}/h
          </span>
        )}
        {sala.disponible && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Disponible
          </span>
        )}
      </div>

      {sala.servicios && sala.servicios.length > 0 && (
        <p className="text-xs text-gray-400 truncate mb-2">
          {sala.servicios.slice(0, 3).join(" · ")}
        </p>
      )}

      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
        {sala.bio || "Centro multiespacio para la industria musical."}
      </p>
    </Link>
  );
}
