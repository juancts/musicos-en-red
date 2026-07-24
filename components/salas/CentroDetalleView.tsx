import type { ReactNode } from "react";
import type { CentroMusical, EspacioEnsayo, PacksUnlocked } from "@/lib/centro";
import { PACKS_HORAS_MES } from "@/lib/centro";
import { formatearPrecioHora } from "@/lib/usuario";

type Props = {
  centro: CentroMusical;
  espacios: EspacioEnsayo[];
};

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 px-3 py-1 rounded-full"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function PacksUnlockedView({ packs }: { packs: PacksUnlocked }) {
  const entradas = PACKS_HORAS_MES.map((h) => ({
    horas: h,
    precio: packs[String(h) as keyof PacksUnlocked],
  })).filter((e) => e.precio != null);

  if (entradas.length === 0) return null;

  return (
    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      {entradas.map(({ horas, precio }) => (
        <li key={horas} className="flex justify-between gap-4 border-b border-gray-50 dark:border-gray-800 pb-2">
          <span>{horas} h / mes</span>
          <span className="font-medium text-amber-800">
            {formatearPrecioHora(precio)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function CentroDetalleView({ centro, espacios }: Props) {
  const precioLocked = formatearPrecioHora(centro.precio_locked_mensual);
  const espaciosActivos = espacios.filter((e) => e.disponible);

  return (
    <>
      {centro.servicios && centro.servicios.length > 0 && (
        <Seccion titulo="Espacios y servicios">
          <Tags items={centro.servicios} />
        </Seccion>
      )}

      {centro.comodidades && centro.comodidades.length > 0 && (
        <Seccion titulo="Instalaciones y comodidades">
          <Tags items={centro.comodidades} />
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Zonas comunes y chill out para antes y después del ensayo. Backline del
            centro o guarda tu equipo. Carga y descarga accesible 24h, cámaras de
            seguridad y acceso con tarjeta magnética personalizada.
          </p>
        </Seccion>
      )}

      {centro.modelos_alquiler && centro.modelos_alquiler.length > 0 && (
        <Seccion titulo="Modelos de alquiler">
          <div className="space-y-4">
            {centro.modelos_alquiler.map((modelo) => (
              <div
                key={modelo}
                className="rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 text-sm"
              >
                <p className="font-medium text-gray-800 dark:text-gray-100">{modelo}</p>
                {modelo.startsWith("Locked") && precioLocked && (
                  <p className="mt-1 text-amber-800">
                    Desde {precioLocked}
                    <span className="text-gray-400 dark:text-gray-500 font-normal"> / mes en exclusiva</span>
                  </p>
                )}
                {modelo.startsWith("Unlocked") && centro.packs_unlocked && (
                  <div className="mt-2">
                    <PacksUnlockedView packs={centro.packs_unlocked} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Seccion>
      )}

      {espacios.length > 0 && (
        <Seccion titulo={`Salas de ensayo (${espaciosActivos.length} disponibles)`}>
          <div className="space-y-3">
            {espacios.map((espacio) => {
              const precio = formatearPrecioHora(espacio.precio_hora);
              return (
                <div
                  key={espacio.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-emerald-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50 text-sm">{espacio.nombre}</p>
                      {!espacio.disponible && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          No disponible
                        </span>
                      )}
                    </div>
                    {precio && (
                      <p className="text-sm font-semibold text-amber-800 flex-shrink-0">
                        {precio}
                        <span className="font-normal text-gray-400 dark:text-gray-500">/h</span>
                      </p>
                    )}
                  </div>
                  {espacio.descripcion && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {espacio.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
                    {espacio.capacidad_max != null && (
                      <span>Hasta {espacio.capacidad_max} pers.</span>
                    )}
                    {espacio.metros_cuadrados != null && (
                      <span>{espacio.metros_cuadrados} m²</span>
                    )}
                  </div>
                  {espacio.equipamiento && espacio.equipamiento.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 truncate">
                      {espacio.equipamiento.join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Seccion>
      )}

      {centro.equipamiento && centro.equipamiento.length > 0 && espacios.length === 0 && (
        <Seccion titulo="Equipamiento general">
          <Tags items={centro.equipamiento} />
        </Seccion>
      )}
    </>
  );
}
