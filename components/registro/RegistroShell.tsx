import Link from "next/link";

export function RegistroLogo() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <span className="font-semibold text-gray-900 text-sm">Músicos en Red</span>
    </div>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            s <= step ? "bg-emerald-600" : "bg-gray-100"
          }`}
        />
      ))}
    </div>
  );
}

export function PantallaExito({
  email,
  extra,
}: {
  email: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Ya casi estás!</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Hemos enviado un enlace de confirmación a{" "}
          <span className="text-gray-700 font-medium">{email}</span>. Confírmalo
          para activar tu cuenta.
        </p>
        {extra && <div className="mt-6">{extra}</div>}
        <Link
          href="/login"
          className="inline-block mt-8 text-sm text-emerald-600 hover:underline"
        >
          Ir al inicio de sesión →
        </Link>
      </div>
    </div>
  );
}

export function RegistroShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <RegistroLogo />
        {children}
      </div>
    </div>
  );
}
