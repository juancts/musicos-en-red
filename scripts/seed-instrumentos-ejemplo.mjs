/**
 * Crea anuncios de instrumentos de demostración en Supabase.
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Uso: npm run seed:instrumentos
 * (Ejecutar migración 004_instrumentos_marketplace.sql antes)
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const DEMO_PASSWORD = "DemoInstrumentos2024!";

/** URLs comprobadas (evitar IDs de Unsplash que devuelven 404) */
const FOTOS = {
  guitarra: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&q=80&auto=format",
  guitarra2: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80&auto=format",
  bajo: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80&auto=format",
  bateria: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format",
  teclas: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800&q=80&auto=format",
  amplificacion: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format",
  audio: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80&auto=format",
  viento: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80&auto=format",
  cuerda: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80&auto=format",
};

const VENDEDORES = [
  {
    slug: "lucia-madrid",
    nombre: "Lucía R.",
    instrumento: "Guitarrista",
    codigo_postal: "28004",
    provincia: "Madrid",
    ciudad: "Madrid",
  },
  {
    slug: "marc-bcn",
    nombre: "Marc V.",
    instrumento: "Bajista",
    codigo_postal: "08002",
    provincia: "Barcelona",
    ciudad: "Barcelona",
  },
  {
    slug: "paula-valencia",
    nombre: "Paula S.",
    instrumento: "Teclista",
    codigo_postal: "46002",
    provincia: "Valencia",
    ciudad: "Valencia",
  },
  {
    slug: "diego-sevilla",
    nombre: "Diego M.",
    instrumento: "Batería",
    codigo_postal: "41001",
    provincia: "Sevilla",
    ciudad: "Sevilla",
  },
];

const ANUNCIOS = [
  {
    vendedorSlug: "lucia-madrid",
    titulo: "Fender Player Stratocaster MIM 2021",
    descripcion:
      "Strat mexicana en sunburst. Poco uso en casa, funda rígida Fender incluida. Cambio de cuerdas hace un mes. Sin golpes graves, algún micro-rayón en el guardabarros.",
    categoria: "guitarra",
    precio: 449,
    condicion: "como_nuevo",
    foto_urls: [FOTOS.guitarra, FOTOS.guitarra2],
  },
  {
    vendedorSlug: "marc-bcn",
    titulo: "Yamaha TRBX304 — bajo activo",
    descripcion:
      "Bajo de 4 cuerdas, sonido versátil para funk y rock. Funda acolchada y cable incluidos. Electrónica OK, trastes en buen estado.",
    categoria: "bajo",
    precio: 285,
    condicion: "buen_estado",
    foto_urls: [FOTOS.bajo],
  },
  {
    vendedorSlug: "diego-sevilla",
    titulo: "Batería Pearl Export Series 5 piezas",
    descripcion:
      "Shell pack con bombo 22\", caja 14\", dos toms y floor tom. Platillos no incluidos. Ideal primer kit semi-pro. Desmontada para recogida.",
    categoria: "bateria",
    precio: 390,
    condicion: "usado",
    foto_urls: [FOTOS.bateria],
  },
  {
    vendedorSlug: "paula-valencia",
    titulo: "Roland FP-30X — piano digital",
    descripcion:
      "88 teclas con peso, sonido SuperNATURAL. Pedal triple y soporte X incluidos. Uso doméstico, sin transporte al escenario.",
    categoria: "teclas",
    precio: 520,
    condicion: "buen_estado",
    foto_urls: [FOTOS.teclas],
  },
  {
    vendedorSlug: "lucia-madrid",
    titulo: "Marshall DSL40CR — combo válvulas",
    descripcion:
      "40W, canal clean + crunch. Reverb a muelles, footswitch incluido. Sonido clásico británico. Vendo por cambio a combo más pequeño.",
    categoria: "amplificacion",
    precio: 395,
    condicion: "buen_estado",
    foto_urls: [FOTOS.amplificacion],
  },
  {
    vendedorSlug: "marc-bcn",
    titulo: "Pack micro Shure SM58 + soporte + cable",
    descripcion:
      "SM58 original, poco uso en ensayos. Soporte de mesa y cable XLR 5 m. Perfecto para voces en directo o home studio.",
    categoria: "audio",
    precio: 95,
    condicion: "como_nuevo",
    foto_urls: [FOTOS.audio],
  },
  {
    vendedorSlug: "paula-valencia",
    titulo: "Saxo alto Yamaha YAS-280",
    descripcion:
      "Ideal estudiante o jazz intermedio. Estuche rígido, boquilla y correa. Revisado en luthier hace 6 meses.",
    categoria: "viento",
    precio: 780,
    condicion: "buen_estado",
    foto_urls: [FOTOS.viento],
  },
  {
    vendedorSlug: "diego-sevilla",
    titulo: "Violín estudiante Stentor II 4/4",
    descripcion:
      "Set completo: arco, estuche, resina y almohadilla. Muy cuidado, un año de clases conservatorio. Cambio a violín de nivel superior.",
    categoria: "cuerda",
    precio: 165,
    condicion: "buen_estado",
    foto_urls: [FOTOS.cuerda],
  },
];

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
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

async function asegurarVendedor(admin, vendedor) {
  const email = `demo-${vendedor.slug}@instrumentos.musicosenred.test`;

  let user = await obtenerUsuarioPorEmail(admin, email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { demo: true, tipo: "musico" },
    });
    if (error) throw error;
    user = data.user;
  }

  if (!user) {
    user = await obtenerUsuarioPorEmail(admin, email);
  }

  if (!user) {
    throw new Error(`No se pudo crear usuario ${email}`);
  }

  const { error: perfilError } = await admin.from("usuarios").upsert(
    {
      id: user.id,
      tipo: "musico",
      nombre: vendedor.nombre,
      email,
      ciudad: vendedor.ciudad,
      codigo_postal: vendedor.codigo_postal,
      provincia: vendedor.provincia,
      instrumento: vendedor.instrumento,
      bio: `Vendedor demo de instrumentos en ${vendedor.provincia}.`,
      disponible: true,
    },
    { onConflict: "id" }
  );

  if (perfilError) {
    throw perfilError;
  }

  return { id: user.id, email, nombre: vendedor.nombre };
}

async function limpiarAnunciosDemo(admin) {
  const emails = VENDEDORES.map(
    (v) => `demo-${v.slug}@instrumentos.musicosenred.test`
  );

  const { data: perfiles } = await admin
    .from("usuarios")
    .select("id")
    .in("email", emails);

  if (perfiles?.length) {
    const ids = perfiles.map((p) => p.id);
    await admin.from("anuncios_instrumentos").delete().in("vendedor_id", ids);
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

  const { error: probeError } = await admin
    .from("anuncios_instrumentos")
    .select("id")
    .limit(1);

  if (probeError) {
    console.error(
      "La tabla anuncios_instrumentos no existe. Ejecuta 004_instrumentos_marketplace.sql en Supabase."
    );
    console.error(probeError.message);
    process.exit(1);
  }

  console.log("Limpiando anuncios demo anteriores...");
  await limpiarAnunciosDemo(admin);

  const vendedorPorSlug = {};

  console.log(`Creando ${VENDEDORES.length} vendedores demo...\n`);

  for (const v of VENDEDORES) {
    const creado = await asegurarVendedor(admin, v);
    vendedorPorSlug[v.slug] = creado;
    console.log(`✓ Vendedor ${creado.nombre} (${creado.email})`);
  }

  console.log(`\nInsertando ${ANUNCIOS.length} anuncios...\n`);

  let insertados = 0;

  for (const anuncio of ANUNCIOS) {
    const vendedor = vendedorPorSlug[anuncio.vendedorSlug];
    if (!vendedor) {
      console.error(`✗ ${anuncio.titulo}: vendedor desconocido`);
      continue;
    }

    const { error } = await admin.from("anuncios_instrumentos").insert({
      vendedor_id: vendedor.id,
      titulo: anuncio.titulo,
      descripcion: anuncio.descripcion,
      categoria: anuncio.categoria,
      precio: anuncio.precio,
      condicion: anuncio.condicion,
      ciudad: VENDEDORES.find((v) => v.slug === anuncio.vendedorSlug)?.ciudad,
      codigo_postal: VENDEDORES.find((v) => v.slug === anuncio.vendedorSlug)
        ?.codigo_postal,
      provincia: VENDEDORES.find((v) => v.slug === anuncio.vendedorSlug)?.provincia,
      foto_urls: anuncio.foto_urls,
      estado: "activo",
    });

    if (error) {
      console.error(`✗ ${anuncio.titulo}:`, error.message);
      continue;
    }

    insertados++;
    console.log(`✓ ${anuncio.titulo} — ${anuncio.precio} €`);
  }

  console.log(`\nListo: ${insertados} anuncios activos. Abre /instrumentos en la app.`);
  console.log(`Contraseña demo vendedores: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
