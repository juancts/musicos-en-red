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
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
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

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/feed"
            className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            Feed
          </Link>
          <Link
            href="/explorar"
            className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            Músicos
          </Link>
          <Link
            href="/salas"
            className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            Centros
          </Link>
          <Link
            href="/instrumentos"
            className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            Instrumentos
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/mensajes"
                    className="relative px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    Mensajes
                    {noLeidos > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                        {noLeidos > 9 ? "9+" : noLeidos}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/perfil"
                    className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    Mi perfil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/registro"
                    className="ml-1 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
