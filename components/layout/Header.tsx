"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/getUser";
import { contarMensajesNoLeidos } from "@/lib/mensajes";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [noLeidos, setNoLeidos] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    getCurrentUser().then((current) => {
      setUser(current);
      setLoading(false);

      if (current) {
        contarMensajesNoLeidos(current.id).then(({ count }) => {
          setNoLeidos(count);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        contarMensajesNoLeidos(session.user.id).then(({ count }) => {
          setNoLeidos(count);
        });
      } else {
        setNoLeidos(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setMenuAbierto(false);
    await signOut();
    window.location.href = "/login";
  };

  const enlaces = (
    <>
      <Link
        href="/feed"
        onClick={() => setMenuAbierto(false)}
        className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
      >
        Feed
      </Link>
      <Link
        href="/explorar"
        onClick={() => setMenuAbierto(false)}
        className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
      >
        Músicos
      </Link>
      <Link
        href="/salas"
        onClick={() => setMenuAbierto(false)}
        className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
      >
        Centros
      </Link>
      <Link
        href="/instrumentos"
        onClick={() => setMenuAbierto(false)}
        className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
      >
        Instrumentos
      </Link>

      {!loading && (
        <>
          {user ? (
            <>
              <Link
                href="/mensajes"
                onClick={() => setMenuAbierto(false)}
                className="relative px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                Mensajes
                {noLeidos > 0 && (
                  <span className="absolute top-1 right-1 md:-top-0.5 md:-right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                    {noLeidos > 9 ? "9+" : noLeidos}
                  </span>
                )}
              </Link>
              <Link
                href="/perfil"
                onClick={() => setMenuAbierto(false)}
                className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                Mi perfil
              </Link>
              <button
                onClick={handleSignOut}
                className="text-left px-3 py-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuAbierto(false)}
                className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                onClick={() => setMenuAbierto(false)}
                className="md:ml-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors text-center"
              >
                Registrarse
              </Link>
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuAbierto(false)}>
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">
            Músicos en Red
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {enlaces}
        </nav>

        <button
          type="button"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          className="md:hidden p-2 -mr-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {menuAbierto && (
        <nav className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1 text-sm bg-white">
          {enlaces}
        </nav>
      )}
    </header>
  );
}
