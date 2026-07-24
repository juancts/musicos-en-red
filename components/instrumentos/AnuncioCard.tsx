import Link from "next/link";
import AnuncioFoto from "@/components/instrumentos/AnuncioFoto";
import BadgeSuscriptor from "@/components/suscripcion/BadgeSuscriptor";
import {
  emojiCategoria,
  etiquetaCategoria,
  etiquetaCondicion,
  formatearPrecioAnuncio,
  type AnuncioInstrumento,
} from "@/lib/instrumentos";

type Props = {
  anuncio: AnuncioInstrumento;
  cerca?: boolean;
  esSuscriptor?: boolean;
};

export default function AnuncioCard({ anuncio, cerca, esSuscriptor }: Props) {
  const foto = anuncio.foto_urls?.[0];

  return (
    <Link
      href={`/instrumentos/${anuncio.id}`}
      className="group block border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all hover:border-emerald-200 hover:bg-emerald-50/40 hover:dark:bg-emerald-950/40"
    >
      <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-800 relative">
        <AnuncioFoto src={foto} emoji={emojiCategoria(anuncio.categoria)} />
        {esSuscriptor && (
          <span className="absolute top-2 left-2">
            <BadgeSuscriptor />
          </span>
        )}
        {cerca && (
          <span className="absolute top-2 right-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">
            Cerca
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-50 group-hover:text-emerald-700">
          {formatearPrecioAnuncio(Number(anuncio.precio))}
        </p>
        <p className="font-medium text-gray-900 dark:text-gray-50 text-sm mt-1 line-clamp-2">
          {anuncio.titulo}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
          {etiquetaCategoria(anuncio.categoria)}
          {" · "}
          {etiquetaCondicion(anuncio.condicion)}
          {anuncio.provincia || anuncio.ciudad
            ? ` · ${anuncio.provincia || anuncio.ciudad}`
            : ""}
        </p>
      </div>
    </Link>
  );
}
