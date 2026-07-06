"use client";

import { useState } from "react";
import type { TipoCuenta } from "@/lib/usuario";
import RegistroMusicoWizard from "@/components/registro/RegistroMusicoWizard";
import RegistroSalaWizard from "@/components/registro/RegistroSalaWizard";
import TipoCuentaSelector from "@/components/registro/TipoCuentaSelector";

export default function RegistroPage() {
  const [tipo, setTipo] = useState<TipoCuenta | null>(null);

  if (!tipo) {
    return <TipoCuentaSelector onSelect={setTipo} />;
  }

  if (tipo === "sala") {
    return <RegistroSalaWizard onChangeTipo={() => setTipo(null)} />;
  }

  return <RegistroMusicoWizard onChangeTipo={() => setTipo(null)} />;
}
