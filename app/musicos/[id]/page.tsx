import { supabase } from "@/lib/supabase";
import type { Partitura } from "@/types";
import { esSala, TIPO_SALA } from "@/lib/usuario";
import { centroSelect } from "@/lib/centro";
import PerfilPublicoSala from "@/components/perfil/PerfilPublicoSala";
import ContactarUsuarioButton from "@/components/mensajes/ContactarUsuarioButton";
import AccionesPerfil from "@/components/moderacion/AccionesPerfil";
import Link from "next/link";
import BadgeSuscriptor from "@/components/suscripcion/BadgeSuscriptor";
import {
  esSuscriptorActivo,
  obtenerSuscripcion,
  salaVisiblePublicamente,
} from "@/lib/suscripcion";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PerfilPublico({ params }: Props) {
  const { id } = await params;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const esCuentaSala = usuario ? usuario.tipo === TIPO_SALA || esSala(usuario) : false;

  if (!usuario || esCuentaSala) {
    const { data: centro } = await supabase
      .from("centros")
      .select(centroSelect)
      .eq("id", id)
      .maybeSingle();

    if (!centro) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            href="/explorar"
            className="text-sm text-emerald-600 hover:underline mb-6 inline-flex items-center gap-1"
          >
            ← Volver
          </Link>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-4">Usuario no encontrado.</p>
        </div>
      );
    }

    const { estado: estadoSuscripcion } = await obtenerSuscripcion(supabase, centro.owner_id);
    const esSuscriptor = esSuscriptorActivo(estadoSuscripcion);

    if (!salaVisiblePublicamente(estadoSuscripcion, centro.created_at)) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            href="/salas"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 hover:dark:text-gray-200 inline-flex items-center gap-1 mb-10"
          >
            ← Centros de ensayo
          </Link>
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔒</p>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Este perfil no está disponible ahora mismo
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              El periodo de prueba gratuito de 60 días de este centro ha terminado y
              todavía no tiene una suscripción activa. Si eres el propietario, puedes
              reactivar tu perfil público en cualquier momento suscribiéndote desde
              tu panel.
            </p>
            <Link
              href="/perfil"
              className="inline-block mt-6 text-sm text-emerald-600 hover:underline"
            >
              Ir a mi panel →
            </Link>
          </div>
        </div>
      );
    }

    const { data: espacios } = await supabase
      .from("espacios_ensayo")
      .select("*")
      .eq("centro_id", id)
      .order("orden", { ascending: true });

    return (
      <PerfilPublicoSala sala={centro} espacios={espacios ?? []} esSuscriptor={esSuscriptor} />
    );
  }

  const { estado: estadoSuscripcion } = await obtenerSuscripcion(supabase, id);
  const esSuscriptor = esSuscriptorActivo(estadoSuscripcion);

  const { data: partituras } = await supabase
    .from("partituras")
    .select("*")
    .eq("usuario_id", id)
    .order("created_at", { ascending: false });

  const puedeMensaje = usuario.disponible && (usuario.contacto_mensajes ?? true);
  const emailVisible =
    usuario.disponible && usuario.contacto_email_publico && usuario.email;
  const telefonoVisible =
    usuario.disponible && usuario.contacto_telefono_publico && usuario.telefono;
  const tieneContacto = puedeMensaje || emailVisible || telefonoVisible;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/explorar"
        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 hover:dark:text-gray-200 inline-flex items-center gap-1 mb-10 transition-colors"
      >
        ← Explorar músicos
      </Link>

      <div className="flex items-start gap-5 mb-10">
        {usuario.avatar_url ? (
          <div
            aria-label="Avatar del perfil"
            className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${usuario.avatar_url})` }}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
            {usuario.nombre?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{usuario.nombre}</h1>
            {esSuscriptor && <BadgeSuscriptor />}
            {usuario.disponible && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Disponible
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{usuario.ciudad}</p>
          {usuario.instrumento && (
            <span className="inline-block mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
              {usuario.instrumento}
            </span>
          )}
          <div className="mt-3">
            <AccionesPerfil usuarioId={usuario.id} redirectLogin={`/musicos/${id}`} />
          </div>
        </div>
      </div>

      {usuario.bio && (
        <div className="mb-10">
          <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Sobre mí
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{usuario.bio}</p>
        </div>
      )}

      {usuario.generos && usuario.generos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Géneros
          </h2>
          <div className="flex flex-wrap gap-2">
            {usuario.generos.map((g: string) => (
              <span key={g} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {tieneContacto && (
        <div className="mb-10 rounded-2xl border border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/40 p-5">
          <h2 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-3">
            Contacto
          </h2>
          <div className="flex flex-wrap gap-2">
            {puedeMensaje && (
              <ContactarUsuarioButton usuarioId={usuario.id} nombre={usuario.nombre} />
            )}
            {emailVisible && (
              <a
                href={`mailto:${usuario.email}`}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-300"
              >
                Enviar email
              </a>
            )}
            {telefonoVisible && (
              <a
                href={`tel:${String(usuario.telefono).replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-300"
              >
                Llamar
              </a>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Partituras{" "}
          {partituras && partituras.length > 0 && (
            <span className="text-gray-300 dark:text-gray-600">({partituras.length})</span>
          )}
        </h2>

        {!partituras || partituras.length === 0 ? (
          <p className="text-sm text-gray-300 dark:text-gray-600">Sin partituras subidas aún.</p>
        ) : (
          <div className="space-y-2">
            {partituras.map((p: Partitura) => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 hover:border-gray-200 hover:dark:border-gray-700 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.titulo}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <a
                  href={p.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:underline ml-4 flex-shrink-0"
                >
                  Ver →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
