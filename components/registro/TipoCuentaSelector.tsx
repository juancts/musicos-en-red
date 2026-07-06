import Link from "next/link";
import type { TipoCuenta } from "@/lib/usuario";
import { RegistroShell } from "./RegistroShell";

type Props = {
  onSelect: (tipo: TipoCuenta) => void;
};

export default function TipoCuentaSelector({ onSelect }: Props) {
  return (
    <RegistroShell>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        ¿Cómo quieres unirte?
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Elige el tipo de cuenta que mejor te describe
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSelect("musico")}
          className="w-full text-left border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
        >
          <span className="text-2xl" aria-hidden>
            🎸
          </span>
          <p className="mt-3 font-medium text-gray-900 text-sm">Soy músico</p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Busco banda, colaboraciones o compartir partituras con otros músicos.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("sala")}
          className="w-full text-left border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
        >
          <span className="text-2xl" aria-hidden>
            🏠
          </span>
          <p className="mt-3 font-medium text-gray-900 text-sm">
            Tengo una sala de ensayos
          </p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Ofrezco mi espacio en alquiler para bandas y músicos.
          </p>
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mt-8">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </RegistroShell>
  );
}
