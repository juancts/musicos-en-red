"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CATEGORIAS_INSTRUMENTO,
  CONDICIONES_ANUNCIO,
  subirFotosAnuncio,
  type CategoriaInstrumento,
  type CondicionAnuncio,
} from "@/lib/instrumentos";
import {
  codigoPostalValido,
  normalizarCodigoPostal,
  provinciaDesdeCodigoPostal,
} from "@/lib/ubicacion";
import { esSuscriptorActivo, LIMITE_ANUNCIOS_GRATIS, obtenerSuscripcion } from "@/lib/suscripcion";

type UbicacionInicial = {
  ciudad?: string | null;
  codigo_postal?: string | null;
  provincia?: string | null;
};

type Props = {
  userId: string;
  ubicacionInicial?: UbicacionInicial;
};

export default function PublicarAnuncioForm({ userId, ubicacionInicial }: Props) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaInstrumento>("guitarra");
  const [condicion, setCondicion] = useState<CondicionAnuncio>("buen_estado");
  const [precio, setPrecio] = useState("");
  const [codigoPostal, setCodigoPostal] = useState(ubicacionInicial?.codigo_postal ?? "");
  const [provincia, setProvincia] = useState(ubicacionInicial?.provincia ?? "");
  const [fotos, setFotos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + fotos.length > 5) {
      setError("Máximo 5 fotos por anuncio.");
      return;
    }
    setFotos((prev) => [...prev, ...files].slice(0, 5));
    setError(null);
    e.target.value = "";
  };

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const precioNum = Number(precio.replace(",", "."));
    if (!titulo.trim() || titulo.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      setError("Introduce un precio válido.");
      return;
    }
    if (codigoPostal && !codigoPostalValido(codigoPostal)) {
      setError("Código postal español no válido.");
      return;
    }

    const { estado: estadoSuscripcion } = await obtenerSuscripcion(supabase, userId);
    if (!esSuscriptorActivo(estadoSuscripcion)) {
      const { count } = await supabase
        .from("anuncios_instrumentos")
        .select("id", { count: "exact", head: true })
        .eq("vendedor_id", userId)
        .eq("estado", "activo");

      if ((count ?? 0) >= LIMITE_ANUNCIOS_GRATIS) {
        setError(
          `El plan gratuito permite hasta ${LIMITE_ANUNCIOS_GRATIS} anuncios activos. Suscríbete desde tu perfil para publicar sin límite.`
        );
        return;
      }
    }

    setGuardando(true);

    let fotoUrls: string[] = [];
    if (fotos.length > 0) {
      const { urls, error: fotoError } = await subirFotosAnuncio(userId, fotos);
      if (fotoError || !urls) {
        setGuardando(false);
        setError(fotoError?.message ?? "No se pudieron subir las fotos. Inténtalo de nuevo.");
        return;
      }
      fotoUrls = urls;
    }

    const provinciaFinal = provinciaDesdeCodigoPostal(codigoPostal) || provincia || null;

    const { data, error: insertError } = await supabase
      .from("anuncios_instrumentos")
      .insert({
        vendedor_id: userId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        categoria,
        condicion,
        precio: precioNum,
        codigo_postal: codigoPostal || null,
        provincia: provinciaFinal,
        ciudad: provinciaFinal,
        foto_urls: fotoUrls,
        estado: "activo",
      })
      .select("id")
      .single();

    setGuardando(false);

    if (insertError || !data) {
      setError(
        insertError?.message.includes("limite_anuncios_activos")
          ? `El plan gratuito permite hasta ${LIMITE_ANUNCIOS_GRATIS} anuncios activos. Suscríbete desde tu perfil para publicar sin límite.`
          : "No pudimos publicar el anuncio. Inténtalo de nuevo."
      );
      return;
    }

    router.push(`/instrumentos/${data.id}`);
  };

  return (
    <form onSubmit={publicar} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
          Título del anuncio
        </label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          required
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Ej. Fender Stratocaster MIM 2020"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaInstrumento)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CATEGORIAS_INSTRUMENTO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Estado del instrumento
          </label>
          <select
            value={condicion}
            onChange={(e) => setCondicion(e.target.value as CondicionAnuncio)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CONDICIONES_ANUNCIO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
          Precio (€)
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="350"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
          Descripción
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full resize-none border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Marca, modelo, accesorios incluidos, motivo de venta..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
          Código postal (ubicación)
        </label>
        <input
          value={codigoPostal}
          inputMode="numeric"
          onChange={(e) => {
            const cp = normalizarCodigoPostal(e.target.value);
            setCodigoPostal(cp);
            setProvincia(provinciaDesdeCodigoPostal(cp));
          }}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="28001"
        />
        {provincia && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Zona: {provincia}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
          Fotos (hasta 5)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFotos}
          className="text-sm text-gray-600 dark:text-gray-300"
        />
        {fotos.length > 0 && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {fotos.length} foto{fotos.length !== 1 ? "s" : ""} seleccionada
            {fotos.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {guardando ? "Publicando..." : "Publicar anuncio"}
      </button>
    </form>
  );
}
