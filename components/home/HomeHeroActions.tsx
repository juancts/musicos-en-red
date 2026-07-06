"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function HomeHeroActions() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="h-11 w-32 rounded-xl bg-gray-100" />
        <div className="h-11 w-36 rounded-xl border border-gray-100" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/feed"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Ver feed
          </Link>
          <Link
            href="/perfil"
            className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
          >
            Mi perfil
          </Link>
          <Link
            href="/explorar"
            className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
          >
            Explorar músicos →
          </Link>
          <Link
            href="/salas"
            className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
          >
            Ver salas →
          </Link>
          <Link
            href="/instrumentos"
            className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
          >
            Instrumentos →
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Sesión iniciada como {user.email}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <Link
        href="/feed"
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Ver feed
      </Link>
      <Link
        href="/registro"
        className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
      >
        Crear cuenta
      </Link>
      <Link
        href="/explorar"
        className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
      >
        Explorar músicos →
      </Link>
      <Link
        href="/salas"
        className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
      >
        Ver salas →
      </Link>
      <Link
        href="/instrumentos"
        className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
      >
        Instrumentos →
      </Link>
    </div>
  );
}
