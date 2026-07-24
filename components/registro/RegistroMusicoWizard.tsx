"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  codigoPostalValido,
  normalizarCodigoPostal,
  provinciaDesdeCodigoPostal,
} from "@/lib/ubicacion";
import { TIPO_MUSICO } from "@/lib/usuario";
import { PantallaExito, ProgressBar, RegistroShell } from "./RegistroShell";

type Step = 1 | 2 | 3 | 4;

const INSTRUMENTOS = [
  { label: "Guitarrista", icon: "🎸" },
  { label: "Bajista", icon: "🎵" },
  { label: "Vocalista", icon: "🎤" },
  { label: "Batería", icon: "🥁" },
  { label: "Teclista", icon: "🎹" },
  { label: "Productor", icon: "🎧" },
  { label: "Violinista", icon: "🎻" },
  { label: "Saxofonista", icon: "🎷" },
  { label: "Trompetista", icon: "🎺" },
];

const BUSCA = [
  { label: "Unirme a una banda", icon: "🎸" },
  { label: "Buscar músicos", icon: "🔍" },
  { label: "Colaborar online", icon: "💻" },
  { label: "Sesiones de estudio", icon: "🎙️" },
];

const GENEROS = [
  "Rock", "Blues", "Jazz", "Pop", "Metal",
  "Funk", "Clásica", "Electrónica", "Hip-hop",
  "Reggae", "Flamenco", "Indie", "Soul", "R&B",
];

type Props = {
  onChangeTipo: () => void;
};

export default function RegistroMusicoWizard({ onChangeTipo }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [bio, setBio] = useState("");
  const [instrumento, setInstrumento] = useState("");
  const [busca, setBusca] = useState<string[]>([]);
  const [generos, setGeneros] = useState<string[]>([]);

  const getPasswordStrength = (p: string) => {
    if (p.length === 0) return 0;
    if (p.length < 6) return 1;
    if (p.length < 10) return 2;
    if (p.length >= 10 && /[^a-zA-Z0-9]/.test(p)) return 4;
    return 3;
  };
  const strength = getPasswordStrength(password);
  const strengthColors = ["bg-gray-200 dark:bg-gray-700", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"];
  const strengthLabels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const provincia = provinciaDesdeCodigoPostal(codigoPostal);

  const toggleGenero = (g: string) => {
    setGeneros((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 5 ? [...prev, g] : prev
    );
  };

  const toggleBusca = (b: string) => {
    setBusca((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!codigoPostalValido(codigoPostal)) {
        setError("Introduce un código postal español válido.");
        setStep(2);
        return;
      }

      const { data, error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(
          signUpError.message === "User already registered"
            ? "Ya existe una cuenta con ese email."
            : signUpError.message
        );
        setStep(1);
        return;
      }

      if (data?.user) {
        await supabase.from("usuarios").insert({
          id: data.user.id,
          tipo: TIPO_MUSICO,
          nombre,
          email,
          ciudad: ciudad || provincia,
          codigo_postal: codigoPostal,
          provincia,
          bio,
          instrumento,
          busca,
          generos,
          disponible: true,
        });
      }

      setSuccess(true);
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return <PantallaExito email={email} />;

  return (
    <RegistroShell>
      <ProgressBar step={step} total={4} />

      {step === 1 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Crea tu cuenta</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">Paso 1 de 4 · Músico</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${strength >= i ? strengthColors[strength] : "bg-gray-200 dark:bg-gray-700"}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength <= 1 ? "text-red-400" : strength <= 2 ? "text-amber-500" : "text-emerald-600"}`}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-3.5 py-2.5 rounded-xl">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onChangeTipo}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium py-2.5 rounded-xl text-sm"
              >
                ← Cambiar tipo
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!email || password.length < 8) {
                    setError("Introduce un email válido y una contraseña de al menos 8 caracteres.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm"
              >
                Continuar →
              </button>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Tu perfil</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">Paso 2 de 4 · Cuéntanos sobre ti</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Nombre artístico</label>
              <input
                type="text"
                placeholder="¿Cómo te conocen?"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Código postal</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="28001"
                value={codigoPostal}
                onChange={(e) => {
                  const next = normalizarCodigoPostal(e.target.value);
                  setCodigoPostal(next);
                  setCiudad(provinciaDesdeCodigoPostal(next));
                }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {provincia ? `Zona detectada: ${provincia}` : "Para encontrar músicos cerca de ti."}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Bio breve</label>
              <textarea
                placeholder="Qué tocas, qué buscas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-300 dark:text-gray-600 text-right mt-1">{bio.length} / 200</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium py-2.5 rounded-xl text-sm">
                ← Atrás
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!codigoPostalValido(codigoPostal)) {
                    setError("Introduce un código postal español válido.");
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm"
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">¿Qué tocas?</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">Paso 3 de 4 · Instrumento y objetivo</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {INSTRUMENTOS.map((inst) => (
              <button
                key={inst.label}
                type="button"
                onClick={() => setInstrumento(inst.label)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm ${
                  instrumento === inst.label
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950 text-emerald-800"
                    : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="text-xl">{inst.icon}</span>
                <span className="text-xs font-medium text-center">{inst.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">¿Qué buscas?</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {BUSCA.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => toggleBusca(b.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                  busca.includes(b.label)
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950 text-emerald-800"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {b.icon} {b.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium py-2.5 rounded-xl text-sm">
              ← Atrás
            </button>
            <button type="button" onClick={() => setStep(4)} className="flex-1 bg-emerald-600 text-white font-medium py-2.5 rounded-xl text-sm">
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">Tus géneros</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">Paso 4 de 4 · Elige hasta 5</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {GENEROS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenero(g)}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium ${
                  generos.includes(g)
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950 text-emerald-800"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-3.5 py-2.5 rounded-xl mb-4">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium py-2.5 rounded-xl text-sm">
              ← Atrás
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm"
            >
              {loading ? "Creando cuenta..." : "¡Empezar! 🎸"}
            </button>
          </div>
        </div>
      )}
    </RegistroShell>
  );
}
