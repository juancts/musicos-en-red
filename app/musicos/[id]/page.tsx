import { supabase } from "@/lib/supabase";
import type { Partitura } from "@/types";
import { esSala, TIPO_SALA } from "@/lib/usuario";
import PerfilPublicoSala from "@/components/perfil/PerfilPublicoSala";
import ContactarUsuarioButton from "@/components/mensajes/ContactarUsuarioButton";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PerfilPublico({ params }: Props) {
  const { id } = await params;

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !usuario) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/explorar"
          className="text-sm text-emerald-600 hover:underline mb-6 inline-flex items-center gap-1"
        >
          ← Volver
        </Link>
        <p className="text-gray-400 text-sm mt-4">Usuario no encontrado.</p>
      </div>
    );
  }

  if (usuario.tipo === TIPO_SALA || esSala(usuario)) {
    const { data: espacios } = await supabase
      .from("espacios_ensayo")
      .select("*")
      .eq("centro_id", id)
      .order("orden", { ascending: true });

    return <PerfilPublicoSala sala={usuario} espacios={espacios ?? []} />;
  }

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
        className="text-sm text-gray-400 hover:text-gray-700 inline-flex items-center gap-1 mb-10 transition-colors"
      >
        ← Explorar músicos
      </Link>

      <div className="flex items-start gap-5 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
          {usuario.nombre?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">{usuario.nombre}</h1>
            {usuario.disponible && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Disponible
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{usuario.ciudad}</p>
          {usuario.instrumento && (
            <span className="inline-block mt-2 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {usuario.instrumento}
            </span>
          )}
        </div>
      </div>

      {usuario.bio && (
        <div className="mb-10">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Sobre mí
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">{usuario.bio}</p>
        </div>
      )}

      {usuario.generos && usuario.generos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Géneros
          </h2>
          <div className="flex flex-wrap gap-2">
            {usuario.generos.map((g: string) => (
              <span key={g} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {tieneContacto && (
        <div className="mb-10 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
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
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-300"
              >
                Enviar email
              </a>
            )}
            {telefonoVisible && (
              <a
                href={`tel:${String(usuario.telefono).replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-300"
              >
                Llamar
              </a>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
          Partituras{" "}
          {partituras && partituras.length > 0 && (
            <span className="text-gray-300">({partituras.length})</span>
          )}
        </h2>

        {!partituras || partituras.length === 0 ? (
          <p className="text-sm text-gray-300">Sin partituras subidas aún.</p>
        ) : (
          <div className="space-y-2">
            {partituras.map((p: Partitura) => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.titulo}</p>
                  <p className="text-xs text-gray-300 mt-0.5">
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
