"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  codigoPostalValido,
  normalizarCodigoPostal,
  provinciaDesdeCodigoPostal,
} from "@/lib/ubicacion";
import SelectorOpciones from "@/components/salas/SelectorOpciones";
import {
  COMODIDADES_CENTRO,
  MODELOS_ALQUILER,
  PACKS_HORAS_MES,
  SERVICIOS_CENTRO,
  toggleEnLista,
  type PacksUnlocked,
} from "@/lib/centro";
import { EQUIPAMIENTO_SALA, TIPO_SALA } from "@/lib/usuario";
import { PantallaExito, ProgressBar, RegistroShell } from "./RegistroShell";

type Step = 1 | 2 | 3 | 4;

type Props = {
  onChangeTipo: () => void;
};

export default function RegistroSalaWizard({ onChangeTipo }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [bio, setBio] = useState("");
  const [precioHora, setPrecioHora] = useState("");
  const [capacidadMax, setCapacidadMax] = useState("");
  const [equipamiento, setEquipamiento] = useState<string[]>([]);
  const [telefono, setTelefono] = useState("");
  const [horario, setHorario] = useState("");
  const [servicios, setServicios] = useState<string[]>([
    "Salas de ensayo",
    "Espacio de coworking",
  ]);
  const [comodidades, setComodidades] = useState<string[]>([
    "Zonas comunes y chill out",
    "Backline del centro",
  ]);
  const [modelosAlquiler, setModelosAlquiler] = useState<string[]>([
    "Unlocked — Packs de horas al mes",
  ]);
  const [packs, setPacks] = useState<PacksUnlocked>({ "4": 120, "8": 200 });
  const [precioLocked, setPrecioLocked] = useState("");
  const [nombrePrimeraSala, setNombrePrimeraSala] = useState("Sala 1");

  const provincia = provinciaDesdeCodigoPostal(codigoPostal);

  const toggleEquipamiento = (item: string) => {
    setEquipamiento((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
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

      const precio = precioHora ? Number(precioHora) : null;
      if (precioHora && (Number.isNaN(precio) || precio! < 0)) {
        setError("Introduce un precio por hora válido.");
        setStep(3);
        return;
      }

      const capacidad = capacidadMax ? Number(capacidadMax) : null;
      if (capacidadMax && (Number.isNaN(capacidad) || capacidad! < 1)) {
        setError("La capacidad debe ser al menos 1 persona.");
        setStep(3);
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
        const packsLimpios = Object.fromEntries(
          Object.entries(packs).filter(([, v]) => v != null && v > 0)
        ) as PacksUnlocked;

        const { error: insertError } = await supabase.from("usuarios").insert({
          id: data.user.id,
          tipo: TIPO_SALA,
          nombre,
          email,
          ciudad: ciudad || provincia,
          codigo_postal: codigoPostal,
          provincia,
          bio,
          direccion: direccion.trim() || null,
          telefono: telefono.trim() || null,
          precio_hora: precio,
          capacidad_max: capacidad,
          equipamiento,
          horario: horario.trim() || null,
          disponible: true,
          servicios,
          comodidades,
          modelos_alquiler: modelosAlquiler,
          packs_unlocked:
            Object.keys(packsLimpios).length > 0 ? packsLimpios : null,
          precio_locked_mensual: precioLocked ? Number(precioLocked) : null,
        });

        if (insertError) {
          setError(
            insertError.message.includes("tipo") ||
              insertError.message.includes("servicios")
              ? "Falta configurar la base de datos. Ejecuta las migraciones 001 y 003 en Supabase."
              : "No pudimos guardar tu centro. Inténtalo de nuevo."
          );
          return;
        }

        // El registro directo como sala sigue creando también su fila en
        // centros (mismo id), reutilizando el id del usuario — así
        // espacios_ensayo (que ahora referencia centros, no usuarios) puede
        // insertarse a continuación sin violar el foreign key.
        await supabase.from("centros").insert({
          id: data.user.id,
          owner_id: data.user.id,
          nombre,
          ciudad: ciudad || provincia,
          codigo_postal: codigoPostal,
          provincia,
          bio,
          direccion: direccion.trim() || null,
          telefono: telefono.trim() || null,
          precio_hora: precio,
          capacidad_max: capacidad,
          equipamiento,
          horario: horario.trim() || null,
          disponible: true,
          servicios,
          comodidades,
          modelos_alquiler: modelosAlquiler,
          packs_unlocked:
            Object.keys(packsLimpios).length > 0 ? packsLimpios : null,
          precio_locked_mensual: precioLocked ? Number(precioLocked) : null,
        });

        if (nombrePrimeraSala.trim()) {
          await supabase.from("espacios_ensayo").insert({
            centro_id: data.user.id,
            nombre: nombrePrimeraSala.trim(),
            precio_hora: precio,
            capacidad_max: capacidad,
            equipamiento,
            orden: 0,
            disponible: true,
          });
        }
      }

      setSuccess(true);
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <PantallaExito
        email={email}
        extra={
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-left text-xs text-emerald-700 leading-relaxed">
            Tu sala será visible gratis en el directorio durante 60 días desde
            hoy. Pasado ese plazo, para seguir apareciendo en las búsquedas
            necesitarás una suscripción activa — puedes gestionarla en
            cualquier momento desde tu panel.
          </div>
        }
      />
    );

  return (
    <RegistroShell>
      <ProgressBar step={step} total={4} />

      {step === 1 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Crea tu cuenta</h1>
          <p className="text-gray-400 text-sm mb-8">Paso 1 de 4 · Centro multiespacio</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="contacto@tusala.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {error && <ErrorBox message={error} />}
            <NavButtons
              backLabel="← Cambiar tipo"
              onBack={onChangeTipo}
              onNext={() => {
                if (!email || password.length < 8) {
                  setError("Email válido y contraseña de al menos 8 caracteres.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Tu centro</h1>
          <p className="text-gray-400 text-sm mb-8">Paso 2 de 4 · Datos del complejo</p>
          <div className="space-y-4">
            <Field
              label="Nombre del centro"
              value={nombre}
              onChange={setNombre}
              placeholder="Ej. Groove Factory"
            />
            <Field
              label="Dirección (opcional)"
              value={direccion}
              onChange={setDireccion}
              placeholder="Calle y número"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Código postal
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="28001"
                value={codigoPostal}
                onChange={(e) => {
                  const cp = normalizarCodigoPostal(e.target.value);
                  setCodigoPostal(cp);
                  setCiudad(provinciaDesdeCodigoPostal(cp));
                }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                {provincia ? `Zona: ${provincia}` : "Para que te encuentren músicos cercanos"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={800}
                rows={4}
                placeholder="Multiespacio para la industria musical: salas, chill out, backline, acceso 24h..."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{bio.length} / 800</p>
            </div>
            {error && <ErrorBox message={error} />}
            <NavButtons
              onBack={() => setStep(1)}
              onNext={() => {
                if (!nombre.trim()) {
                  setError("Indica el nombre de tu sala.");
                  return;
                }
                if (!codigoPostalValido(codigoPostal)) {
                  setError("Código postal español válido requerido.");
                  return;
                }
                setError(null);
                setStep(3);
              }}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Servicios y salas</h1>
          <p className="text-gray-400 text-sm mb-8">Paso 3 de 4 · Espacios, precios y equipamiento</p>
          <div className="space-y-4">
            <SelectorOpciones
              titulo="Espacios y servicios del centro"
              opciones={SERVICIOS_CENTRO}
              seleccionados={servicios}
              onToggle={(item) => setServicios((s) => toggleEnLista(s, item))}
            />
            <SelectorOpciones
              titulo="Comodidades"
              opciones={COMODIDADES_CENTRO}
              seleccionados={comodidades}
              onToggle={(item) => setComodidades((s) => toggleEnLista(s, item))}
            />
            <SelectorOpciones
              titulo="Modelos de alquiler"
              opciones={MODELOS_ALQUILER}
              seleccionados={modelosAlquiler}
              onToggle={(item) => setModelosAlquiler((s) => toggleEnLista(s, item))}
            />
            {modelosAlquiler.some((m) => m.startsWith("Locked")) && (
              <Field
                label="Precio exclusiva mensual (€)"
                value={precioLocked}
                onChange={setPrecioLocked}
                placeholder="800"
              />
            )}
            {modelosAlquiler.some((m) => m.startsWith("Unlocked")) && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Packs Unlocked (€/mes)</p>
                <div className="grid grid-cols-2 gap-2">
                  {PACKS_HORAS_MES.map((h) => (
                    <label key={h} className="text-xs text-gray-600">
                      {h} h/mes
                      <input
                        type="number"
                        min={0}
                        value={packs[String(h) as keyof PacksUnlocked] ?? ""}
                        onChange={(e) =>
                          setPacks((p) => ({
                            ...p,
                            [String(h)]: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Field
              label="Nombre de tu primera sala de ensayo"
              value={nombrePrimeraSala}
              onChange={setNombrePrimeraSala}
              placeholder="Sala A"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Precio / hora (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="15"
                  value={precioHora}
                  onChange={(e) => setPrecioHora(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Capacidad máx.
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="6"
                  value={capacidadMax}
                  onChange={(e) => setCapacidadMax(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700">Equipamiento incluido</p>
            <div className="flex flex-wrap gap-2">
              {EQUIPAMIENTO_SALA.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquipamiento(item)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    equipamiento.includes(item)
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            {error && <ErrorBox message={error} />}
            <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Contacto</h1>
          <p className="text-gray-400 text-sm mb-8">Paso 4 de 4 · Horario y teléfono</p>
          <div className="space-y-4">
            <Field
              label="Teléfono de contacto"
              value={telefono}
              onChange={setTelefono}
              placeholder="600 000 000"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Horario de alquiler
              </label>
              <textarea
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                rows={3}
                placeholder="Ej. Lun–Vie 10:00–23:00, Sáb 10:00–02:00"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {nombre && (
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Vista previa
                </p>
                <p className="text-sm font-medium text-gray-900">{nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {provincia}
                  {precioHora ? ` · ${precioHora} €/h` : ""}
                </p>
                {equipamiento.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {equipamiento.slice(0, 4).map((e) => (
                      <span
                        key={e}
                        className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {error && <ErrorBox message={error} />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm"
              >
                ← Atrás
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm"
              >
                {loading ? "Creando cuenta..." : "Publicar centro 🏢"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RegistroShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-3.5 py-2.5 rounded-xl">
      {message}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  backLabel = "← Atrás",
}: {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm"
      >
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm"
      >
        Continuar →
      </button>
    </div>
  );
}
