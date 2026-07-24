"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string;
  onUploadComplete?: () => void;
};

type Estado = "idle" | "subiendo" | "ok" | "error";

export default function SubirPartitura({ userId, onUploadComplete }: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const permitidos = ["application/pdf", "image/png", "image/jpeg"];
    if (!permitidos.includes(file.type)) {
      setErrorMsg("Solo se permiten archivos PDF, PNG o JPG.");
      setEstado("error");
      return;
    }

    setEstado("subiendo");
    setErrorMsg(null);

    const filePath = `${userId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("partituras")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setErrorMsg("Error al subir el archivo. Inténtalo de nuevo.");
      setEstado("error");
      return;
    }

    const { data } = supabase.storage.from("partituras").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("partituras").insert({
      usuario_id: userId,
      titulo: file.name,
      archivo_url: data.publicUrl,
    });

    if (insertError) {
      setErrorMsg("Archivo subido pero no se pudo registrar.");
      setEstado("error");
      return;
    }

    setNombreArchivo(file.name);
    setEstado("ok");
    e.target.value = "";
    onUploadComplete?.();
  };

  return (
    <label className={`
      block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
      ${estado === "subiendo" ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/50" : ""}
      ${estado === "ok" ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950" : ""}
      ${estado === "error" ? "border-red-200 bg-red-50/50" : ""}
      ${estado === "idle" ? "border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/30 hover:dark:bg-emerald-950/30" : ""}
    `}>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleUpload}
        disabled={estado === "subiendo"}
        className="hidden"
      />

      {estado === "subiendo" && (
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-emerald-600">Subiendo archivo...</p>
        </div>
      )}

      {estado === "ok" && (
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-700">{nombreArchivo}</p>
          <p className="text-xs text-emerald-500">Subido correctamente · Haz clic para subir otro</p>
        </div>
      )}

      {estado === "error" && (
        <div className="space-y-1">
          <p className="text-sm text-red-500">{errorMsg}</p>
          <p className="text-xs text-red-400">Haz clic para intentarlo de nuevo</p>
        </div>
      )}

      {estado === "idle" && (
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-emerald-600 font-medium">Selecciona un archivo</span> o arrástralo aquí
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, PNG o JPG</p>
          </div>
        </div>
      )}
    </label>
  );
}
