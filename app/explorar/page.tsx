"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { esMusico } from "@/lib/usuario";
import { obtenerSuscriptoresActivos } from "@/lib/suscripcion";
import BadgeSuscriptor from "@/components/suscripcion/BadgeSuscriptor";

type MusicoExplorar = {
  id: string;
  tipo?: string | null;
  nombre: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  bio: string | null;
  avatar_url: string | null;
  instrumento: string | null;
  generos: string[] | null;
  busca: string[] | null;
  disponible: boolean | null;
  created_at?: string | null;
};

type MiUbicacion = {
  id: string;
  codigo_postal: string | null;
  provincia: string | null;
};

type Alcance = "cerca" | "todos";

function prefijoCp(cp: string | null | undefined) {
  return cp?.slice(0, 2) || "";
}

function textoNormalizado(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function puntajeCercania(musico: MusicoExplorar, miUbicacion: MiUbicacion | null) {
  if (!miUbicacion) return 0;

  const mismoCp =
    miUbicacion.codigo_postal &&
    musico.codigo_postal &&
    miUbicacion.codigo_postal === musico.codigo_postal;

  if (mismoCp) return 4;

  const mismoPrefijo =
    prefijoCp(miUbicacion.codigo_postal) &&
    prefijoCp(miUbicacion.codigo_postal) === prefijoCp(musico.codigo_postal);

  if (mismoPrefijo) return 3;

  const mismaProvincia =
    miUbicacion.provincia &&
    musico.provincia &&
    miUbicacion.provincia === musico.provincia;

  if (mismaProvincia) return 2;

  return 0;
}

function etiquetaCercania(musico: MusicoExplorar, miUbicacion: MiUbicacion | null) {
  const puntaje = puntajeCercania(musico, miUbicacion);
  if (puntaje >= 4) return "Mismo CP";
  if (puntaje >= 3) return "Zona cercana";
  if (puntaje >= 2) return "Provincia";
  return null;
}

function coincideBusqueda(musico: MusicoExplorar, busqueda: string) {
  const query = textoNormalizado(busqueda.trim());
  if (!query) return true;

  const texto = textoNormalizado(
    [
      musico.nombre,
      musico.instrumento,
      musico.provincia,
      musico.ciudad,
      musico.codigo_postal,
      musico.bio,
      ...(musico.generos ?? []),
      ...(musico.busca ?? []),
    ].join(" ")
  );

  return texto.includes(query);
}

export default function ExplorarPage() {
  const [musicos, setMusicos] = useState<MusicoExplorar[]>([]);
  const [suscriptores, setSuscriptores] = useState<Set<string>>(new Set());
  const [miUbicacion, setMiUbicacion] = useState<MiUbicacion | null>(null);
  const [alcance, setAlcance] = useState<Alcance>("cerca");
  const [provincia, setProvincia] = useState("");
  const [instrumento, setInstrumento] = useState("");
  const [genero, setGenero] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function cargarMusicos() {
      setLoading(true);
      setError(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: miPerfil } = await supabase
          .from("usuarios")
          .select("id,codigo_postal,provincia")
          .eq("id", user.id)
          .maybeSingle();

        setMiUbicacion({
          id: user.id,
          codigo_postal: miPerfil?.codigo_postal ?? null,
          provincia: miPerfil?.provincia ?? null,
        });

        if (!miPerfil?.codigo_postal && !miPerfil?.provincia) {
          setAlcance("todos");
        }
      } else {
        setMiUbicacion(null);
        setAlcance("todos");
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select(
          "id, tipo, nombre, ciudad, codigo_postal, provincia, bio, avatar_url, instrumento, generos, busca, disponible, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setError(true);
        setLoading(false);
        return;
      }

      const lista = ((data as MusicoExplorar[] | null) ?? []).filter((musico) =>
        esMusico(musico)
      );

      setMusicos(lista);
      setLoading(false);

      obtenerSuscriptoresActivos(
        supabase,
        lista.map((musico) => musico.id)
      ).then(setSuscriptores);
    }

    cargarMusicos();
  }, []);

  const provincias = useMemo(
    () =>
      Array.from(
        new Set(
          musicos
            .map((musico) => musico.provincia)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "es")),
    [musicos]
  );

  const instrumentos = useMemo(
    () =>
      Array.from(
        new Set(
          musicos
            .map((musico) => musico.instrumento)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "es")),
    [musicos]
  );

  const generos = useMemo(
    () =>
      Array.from(new Set(musicos.flatMap((musico) => musico.generos ?? []))).sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [musicos]
  );

  const musicosOrdenados = useMemo(() => {
    return musicos
      .filter((musico) => musico.id !== miUbicacion?.id)
      .filter((musico) => (alcance === "cerca" ? puntajeCercania(musico, miUbicacion) > 0 : true))
      .filter((musico) => (provincia ? musico.provincia === provincia : true))
      .filter((musico) => (instrumento ? musico.instrumento === instrumento : true))
      .filter((musico) => (genero ? musico.generos?.includes(genero) : true))
      .filter((musico) => (soloDisponibles ? Boolean(musico.disponible) : true))
      .filter((musico) => coincideBusqueda(musico, busqueda))
      .sort((a, b) => {
        const diferenciaCercania =
          puntajeCercania(b, miUbicacion) - puntajeCercania(a, miUbicacion);
        if (diferenciaCercania !== 0) return diferenciaCercania;

        const diferenciaSuscriptor =
          Number(suscriptores.has(b.id)) - Number(suscriptores.has(a.id));
        if (diferenciaSuscriptor !== 0) return diferenciaSuscriptor;

        const diferenciaDisponible =
          Number(Boolean(b.disponible)) - Number(Boolean(a.disponible));
        if (diferenciaDisponible !== 0) return diferenciaDisponible;

        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
  }, [
    alcance,
    busqueda,
    genero,
    instrumento,
    miUbicacion,
    musicos,
    provincia,
    soloDisponibles,
    suscriptores,
  ]);

  const tieneUbicacion = Boolean(miUbicacion?.provincia || miUbicacion?.codigo_postal);

  const limpiarFiltros = () => {
    setProvincia("");
    setInstrumento("");
    setGenero("");
    setBusqueda("");
    setSoloDisponibles(false);
    setAlcance(tieneUbicacion ? "cerca" : "todos");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            Comunidad musical
          </span>
          <h1 className="text-2xl font-semibold text-gray-900">
            Explorar musicos
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {tieneUbicacion
              ? `Primero mostramos perfiles cerca de ${miUbicacion?.provincia || miUbicacion?.codigo_postal}.`
              : "Completa tu codigo postal para priorizar perfiles cercanos."}
          </p>
        </div>

        <Link
          href="/perfil"
          className="inline-flex w-fit items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Completar ubicacion
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex rounded-xl border border-gray-200 p-1">
            <button
              type="button"
              disabled={!tieneUbicacion}
              onClick={() => setAlcance("cerca")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                alcance === "cerca"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Cerca
            </button>
            <button
              type="button"
              onClick={() => setAlcance("todos")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                alcance === "todos"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Todos
            </button>
          </div>

          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre, instrumento, genero o zona"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={provincia}
            onChange={(event) => setProvincia(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
          >
            <option value="">Todas las provincias</option>
            {provincias.map((item) => (
              <option key={item} value={item ?? ""}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={instrumento}
            onChange={(event) => setInstrumento(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
          >
            <option value="">Todos los instrumentos</option>
            {instrumentos.map((item) => (
              <option key={item} value={item ?? ""}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={genero}
            onChange={(event) => setGenero(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
          >
            <option value="">Todos los generos</option>
            {generos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600">
            Disponibles
            <input
              type="checkbox"
              checked={soloDisponibles}
              onChange={(event) => setSoloDisponibles(event.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {loading ? "Buscando perfiles..." : `${musicosOrdenados.length} resultados`}
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-700"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 rounded-2xl border border-gray-100 bg-gray-50/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-red-400">
            Error al cargar musicos. Intentalo de nuevo.
          </p>
        </div>
      ) : musicosOrdenados.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            No hay musicos para mostrar con esos filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {musicosOrdenados.map((musico) => {
            const cercania = etiquetaCercania(musico, miUbicacion);

            return (
              <Link
                key={musico.id}
                href={`/musicos/${musico.id}`}
                className="group block rounded-2xl border border-gray-100 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="mb-3 flex items-center gap-3">
                  {musico.avatar_url ? (
                    <div
                      aria-label="Avatar del perfil"
                      className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 bg-cover bg-center"
                      style={{ backgroundImage: `url(${musico.avatar_url})` }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {musico.nombre?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-emerald-700">
                      {musico.nombre || "Musico sin nombre"}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {musico.provincia || musico.ciudad || "Sin ubicacion"}
                      {musico.codigo_postal ? ` · ${musico.codigo_postal}` : ""}
                    </p>
                  </div>
                  {suscriptores.has(musico.id) && <BadgeSuscriptor />}
                  {cercania && (
                    <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {cercania}
                    </span>
                  )}
                </div>

                <div className="mb-2 flex flex-wrap gap-1.5">
                  {musico.instrumento && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-600">
                      {musico.instrumento}
                    </span>
                  )}
                  {musico.disponible && (
                    <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-500">
                      Disponible
                    </span>
                  )}
                </div>

                {musico.generos && musico.generos.length > 0 && (
                  <p className="mb-2 truncate text-xs text-gray-400">
                    {musico.generos.slice(0, 3).join(" · ")}
                  </p>
                )}

                <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">
                  {musico.bio || "Perfil musical sin bio todavia."}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
