"use client";

type Props = {
  titulo: string;
  opciones: readonly string[];
  seleccionados: string[];
  onToggle: (item: string) => void;
};

export default function SelectorOpciones({
  titulo,
  opciones,
  seleccionados,
  onToggle,
}: Props) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {opciones.map((item) => {
          const activo = seleccionados.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activo
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
