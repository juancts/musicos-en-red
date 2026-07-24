/**
 * Crea centros multiespacio de demostración en Supabase.
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Uso: npm run seed:salas
 * (Ejecutar migraciones 001 y 003 antes)
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const DEMO_PASSWORD = "DemoSalas2024!";

const SALAS = [
  {
    slug: "groove-factory",
    nombre: "Groove Factory",
    codigo_postal: "08001",
    provincia: "Barcelona",
    ciudad: "Barcelona",
    direccion: "Carrer del Rec, 15",
    bio: "Multiespacio para la industria musical: varias salas de ensayo, chill out, coworking y estudio. Backline del centro o guarda tu equipo. Carga y descarga 24h, cámaras y acceso con tarjeta magnética.",
    telefono: "600 222 002",
    horario: "Mar–Sáb 11:00–24:00",
    servicios: [
      "Salas de ensayo",
      "Espacio de coworking",
      "Estudio de grabación",
      "Producción y difusión para bandas",
    ],
    comodidades: [
      "Zonas comunes y chill out",
      "Zona para fumadores",
      "Backline del centro",
      "Guarda tu equipo",
      "Carga y descarga 24h",
      "Cámaras de seguridad",
      "Acceso con tarjeta magnética",
    ],
    modelos_alquiler: [
      "Locked — Exclusiva mensual",
      "Unlocked — Packs de horas al mes",
    ],
    packs_unlocked: { "2": 70, "4": 120, "8": 200, "16": 340 },
    precio_locked_mensual: 950,
    espacios: [
      {
        nombre: "Sala A — 18 m²",
        descripcion: "Ideal batería y combo pequeño.",
        precio_hora: 16,
        capacidad_max: 4,
        metros_cuadrados: 18,
        equipamiento: ["Batería completa", "Amplificador guitarra", "PA / microfonía"],
      },
      {
        nombre: "Sala B — 28 m²",
        descripcion: "Banda completa con PA.",
        precio_hora: 22,
        capacidad_max: 6,
        metros_cuadrados: 28,
        equipamiento: [
          "Batería completa",
          "Amplificador guitarra",
          "Amplificador bajo",
          "PA / microfonía",
          "Aire acondicionado",
        ],
      },
      {
        nombre: "Sala C — Cabina",
        descripcion: "Ensayo acústico o grabación demo.",
        precio_hora: 14,
        capacidad_max: 3,
        metros_cuadrados: 12,
        equipamiento: ["Cabina de grabación", "Teclado / piano"],
      },
    ],
  },
  {
    slug: "estudio-norte",
    nombre: "Estudio Norte",
    codigo_postal: "28003",
    provincia: "Madrid",
    ciudad: "Madrid",
    direccion: "Calle de Bravo Murillo, 42",
    bio: "Centro de ensayos con zonas comunes chill out antes y después de tu sesión. Taller de reparación y salón para eventos.",
    telefono: "600 111 001",
    horario: "Lun–Dom 10:00–23:00",
    servicios: [
      "Salas de ensayo",
      "Taller de reparación de instrumentos",
      "Salones y terrazas para eventos",
    ],
    comodidades: [
      "Zonas comunes y chill out",
      "Backline del centro",
      "Guarda tu equipo",
      "Carga y descarga 24h",
      "Cámaras de seguridad",
    ],
    modelos_alquiler: ["Unlocked — Packs de horas al mes"],
    packs_unlocked: { "4": 100, "8": 180, "16": 300 },
    precio_locked_mensual: null,
    espacios: [
      {
        nombre: "Sala Rock",
        precio_hora: 18,
        capacidad_max: 6,
        metros_cuadrados: 25,
        equipamiento: ["Batería completa", "Amplificador guitarra", "Amplificador bajo"],
      },
      {
        nombre: "Sala Pro",
        precio_hora: 24,
        capacidad_max: 8,
        metros_cuadrados: 35,
        equipamiento: ["Batería completa", "PA / microfonía", "Cabina de grabación"],
      },
    ],
  },
  {
    slug: "bunker-sonoro",
    nombre: "Bunker Sonoro",
    codigo_postal: "46001",
    provincia: "Valencia",
    ciudad: "Valencia",
    direccion: "C/ de Colón, 28",
    bio: "Tres salas a precios distintos. Zona fumadores y parking. Pensado para bandas en formación.",
    telefono: "600 333 003",
    horario: "Lun–Vie 16:00–22:00",
    servicios: ["Salas de ensayo", "Espacio de coworking"],
    comodidades: [
      "Zona para fumadores",
      "Backline del centro",
      "Parking",
      "Cámaras de seguridad",
    ],
    modelos_alquiler: ["Unlocked — Packs de horas al mes"],
    packs_unlocked: { "2": 50, "4": 90 },
    precio_locked_mensual: null,
    espacios: [
      { nombre: "Sala S", precio_hora: 10, capacidad_max: 4, metros_cuadrados: 14, equipamiento: ["Amplificador guitarra"] },
      { nombre: "Sala M", precio_hora: 14, capacidad_max: 5, metros_cuadrados: 20, equipamiento: ["Batería completa", "Amplificador bajo"] },
      { nombre: "Sala L", precio_hora: 17, capacidad_max: 6, metros_cuadrados: 26, equipamiento: ["Batería completa", "PA / microfonía"] },
    ],
  },
  {
    slug: "nave-del-ritmo",
    nombre: "Nave del Ritmo",
    codigo_postal: "29001",
    provincia: "Málaga",
    ciudad: "Málaga",
    direccion: "Calle Larios, 8",
    bio: "Nave multiespacio con terraza para eventos y estudio de grabación. Alquiler locked disponible.",
    telefono: "600 666 006",
    horario: "Mar–Dom 10:00–22:00",
    servicios: [
      "Salas de ensayo",
      "Salones y terrazas para eventos",
      "Estudio de grabación",
    ],
    comodidades: [
      "Zonas comunes y chill out",
      "Carga y descarga 24h",
      "Acceso con tarjeta magnética",
      "Parking",
    ],
    modelos_alquiler: ["Locked — Exclusiva mensual"],
    packs_unlocked: null,
    precio_locked_mensual: 1200,
    disponible: false,
    espacios: [
      {
        nombre: "Nave principal",
        precio_hora: 28,
        capacidad_max: 12,
        metros_cuadrados: 80,
        equipamiento: ["Batería completa", "PA / microfonía", "Parking"],
        disponible: false,
      },
    ],
  },
];

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    console.error("No se encontró .env.local");
    process.exit(1);
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function obtenerUsuarioPorEmail(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function limpiarDemoPrevio(admin, email) {
  const { data: perfil } = await admin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (perfil?.id) {
    await admin.from("espacios_ensayo").delete().eq("centro_id", perfil.id);
    await admin.from("usuarios").delete().eq("id", perfil.id);
  }

  const authUser = await obtenerUsuarioPorEmail(admin, email);
  if (authUser) {
    await admin.auth.admin.deleteUser(authUser.id);
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Creando ${SALAS.length} centros de ejemplo...\n`);

  for (const centro of SALAS) {
    const email = `demo-${centro.slug}@salas.musicosenred.test`;

    await limpiarDemoPrevio(admin, email);

    let user =
      (await obtenerUsuarioPorEmail(admin, email)) ??
      (
        await admin.auth.admin.createUser({
          email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { demo: true, tipo: "sala" },
        })
      ).data?.user;

    if (!user) user = await obtenerUsuarioPorEmail(admin, email);
    if (!user) {
      console.error(`✗ ${centro.nombre}: sin usuario`);
      continue;
    }

    const precios = centro.espacios.map((e) => e.precio_hora).filter(Boolean);
    const precioDesde = precios.length ? Math.min(...precios) : null;

    const perfilCompleto = {
      id: user.id,
      tipo: "sala",
      nombre: centro.nombre,
      email,
      ciudad: centro.ciudad,
      codigo_postal: centro.codigo_postal,
      provincia: centro.provincia,
      bio: centro.bio,
      direccion: centro.direccion,
      telefono: centro.telefono,
      precio_hora: precioDesde,
      capacidad_max: centro.espacios[0]?.capacidad_max ?? null,
      equipamiento: centro.espacios[0]?.equipamiento ?? [],
      horario: centro.horario,
      disponible: centro.disponible ?? true,
      servicios: centro.servicios,
      comodidades: centro.comodidades,
      modelos_alquiler: centro.modelos_alquiler,
      packs_unlocked: centro.packs_unlocked,
      precio_locked_mensual: centro.precio_locked_mensual,
    };

    let { error: perfilError } = await admin
      .from("usuarios")
      .upsert(perfilCompleto, { onConflict: "id" });

    if (
      perfilError &&
      (perfilError.message.includes("comodidades") ||
        perfilError.message.includes("servicios") ||
        perfilError.message.includes("schema cache"))
    ) {
      const {
        servicios: _s,
        comodidades: _c,
        modelos_alquiler: _m,
        packs_unlocked: _p,
        precio_locked_mensual: _l,
        ...legacy
      } = perfilCompleto;
      ({ error: perfilError } = await admin
        .from("usuarios")
        .upsert(legacy, { onConflict: "id" }));
    }

    if (perfilError) {
      console.error(`✗ ${centro.nombre}:`, perfilError.message);
      continue;
    }

    // Espejo en centros (mismo id que el usuario) — espacios_ensayo ahora
    // referencia centros, no usuarios.
    const { error: centroError } = await admin.from("centros").upsert(
      {
        id: user.id,
        owner_id: user.id,
        nombre: centro.nombre,
        ciudad: centro.ciudad,
        codigo_postal: centro.codigo_postal,
        provincia: centro.provincia,
        bio: centro.bio,
        direccion: centro.direccion,
        telefono: centro.telefono,
        precio_hora: precioDesde,
        capacidad_max: centro.espacios[0]?.capacidad_max ?? null,
        equipamiento: centro.espacios[0]?.equipamiento ?? [],
        horario: centro.horario,
        disponible: centro.disponible ?? true,
        servicios: centro.servicios,
        comodidades: centro.comodidades,
        modelos_alquiler: centro.modelos_alquiler,
        packs_unlocked: centro.packs_unlocked,
        precio_locked_mensual: centro.precio_locked_mensual,
      },
      { onConflict: "id" }
    );

    if (centroError) {
      console.error(`✗ ${centro.nombre} (centros):`, centroError.message);
      continue;
    }

    let salasCreadas = 0;
    const { error: delError } = await admin
      .from("espacios_ensayo")
      .delete()
      .eq("centro_id", user.id);

    if (!delError || !delError.message.includes("espacios_ensayo")) {
      for (let i = 0; i < centro.espacios.length; i++) {
        const e = centro.espacios[i];
        const { error: espError } = await admin.from("espacios_ensayo").insert({
          centro_id: user.id,
          nombre: e.nombre,
          descripcion: e.descripcion ?? null,
          precio_hora: e.precio_hora,
          capacidad_max: e.capacidad_max,
          metros_cuadrados: e.metros_cuadrados ?? null,
          equipamiento: e.equipamiento ?? [],
          orden: i,
          disponible: e.disponible ?? true,
        });
        if (!espError) salasCreadas++;
      }
    }

    const aviso =
      salasCreadas < centro.espacios.length
        ? " (ejecuta 003_centro_multiespacio.sql para multiespacio completo)"
        : "";

    console.log(
      `✓ ${centro.nombre} — ${salasCreadas || 1} sala(s) (desde ${precioDesde} €/h)${aviso}`
    );
  }

  console.log("\nListo. Abre /salas en la app.");
  console.log(`Contraseña demo: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
