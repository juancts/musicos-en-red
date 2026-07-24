"use client";

export default function SalasError({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-sm font-medium text-red-600">No pudimos cargar las salas.</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Inténtalo de nuevo en unos segundos.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
