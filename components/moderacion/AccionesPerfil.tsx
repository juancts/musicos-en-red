"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BloquearUsuarioButton from "@/components/moderacion/BloquearUsuarioButton";
import ReportarButton from "@/components/moderacion/ReportarButton";

type Props = {
  usuarioId: string;
  redirectLogin: string;
};

export default function AccionesPerfil({ usuarioId, redirectLogin }: Props) {
  const [esPropio, setEsPropio] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let activo = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!activo) return;
      setEsPropio(Boolean(user && user.id === usuarioId));
      setListo(true);
    });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (!listo || esPropio) return null;

  return (
    <div className="flex items-center gap-4">
      <ReportarButton
        tipoObjetivo="usuario"
        objetivoId={usuarioId}
        redirectLogin={redirectLogin}
      />
      <BloquearUsuarioButton usuarioId={usuarioId} redirectLogin={redirectLogin} />
    </div>
  );
}
