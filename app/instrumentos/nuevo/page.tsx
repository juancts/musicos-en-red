"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicarAnuncioForm from "@/components/instrumentos/PublicarAnuncioForm";
import { supabase } from "@/lib/supabase";

export default function NuevoAnuncioPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ubicacion, setUbicacion] = useState<{
    ciudad?: string | null;
    codigo_postal?: string | null;
    provincia?: string | null;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: perfil } = await supabase
        .from("usuarios")
        .select("ciudad, codigo_postal, provincia")
        .eq("id", user.id)
        .maybeSingle();

      if (perfil) {
        setUbicacion(perfil);
      }
      setLoading(false);
    }

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Inicia sesión para publicar</h1>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          Necesitas una cuenta para vender instrumentos en la comunidad.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent("/instrumentos/nuevo")}`}
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link
        href="/instrumentos"
        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 hover:dark:text-gray-200 mb-8 inline-block"
      >
        ← Volver al mercado
      </Link>
      <span className="inline-block text-xs font-medium text-violet-700 bg-violet-50 px-3 py-1 rounded-full mb-4">
        Nuevo anuncio
      </span>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Publicar instrumento</h1>
      <p className="text-gray-400 dark:text-gray-500 text-sm mb-10">
        Los compradores te contactarán por mensaje. Tú gestionas pago y entrega.
      </p>
      <PublicarAnuncioForm userId={userId} ubicacionInicial={ubicacion} />
    </div>
  );
}
