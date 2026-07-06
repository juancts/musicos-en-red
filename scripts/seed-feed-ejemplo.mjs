/**
 * Publicaciones de ejemplo en el feed.
 * Uso: npm run seed:feed
 * Requiere 005_feed_publicaciones.sql y usuarios demo (npm run seed:instrumentos ayuda).
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const POSTS = [
  {
    email: "demo-lucia-madrid@instrumentos.musicosenred.test",
    tipo: "show",
    contenido:
      "Este sábado tocamos en La Coquette (Madrid): set de rock alternativo + algún cover. ¡Pasad a saludar! 🎸",
    diasDesdeAhora: 5,
    hora: 21,
    lugar: "Sala La Coquette, Madrid",
  },
  {
    email: "demo-marc-bcn@instrumentos.musicosenred.test",
    tipo: "post",
    contenido:
      "Busco batería y teclista para proyecto funk-soul en BCN. Ensayos martes/jueves por la tarde. DM si te interesa.",
  },
  {
    email: "demo-paula-valencia@instrumentos.musicosenred.test",
    tipo: "show",
    contenido: "Concierto acústico en el Claustro del Carmen — entrada libre hasta completar aforo.",
    diasDesdeAhora: 12,
    hora: 20,
    lugar: "Claustro del Carmen, Valencia",
  },
  {
    email: "demo-diego-sevilla@instrumentos.musicosenred.test",
    tipo: "post",
    contenido:
      "Acabo de montar el nuevo kit en el local. ¿Alguien con sala de ensayo libre los viernes por la tarde en Sevilla?",
  },
  {
    email: "demo-lucia-madrid@instrumentos.musicosenred.test",
    tipo: "post",
    contenido: "Subí partituras nuevas al perfil. Feedback bienvenido antes del ensayo del jueves.",
  },
  {
    email: "demo-marc-bcn@instrumentos.musicosenred.test",
    tipo: "show",
    contenido: "Jam session abierta — traed vuestro instrumento y entrad en la ronda de solos.",
    diasDesdeAhora: 2,
    hora: 19,
    lugar: "Bar Musical Robadors, Barcelona",
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

function fechaShow(dias, hora) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Faltan variables en .env.local");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: probe } = await admin.from("publicaciones").select("id").limit(1);
  if (probe) {
    console.error("Ejecuta 005_feed_publicaciones.sql primero.");
    console.error(probe.message);
    process.exit(1);
  }

  const emails = [...new Set(POSTS.map((p) => p.email))];
  const { data: usuarios } = await admin
    .from("usuarios")
    .select("id, email")
    .in("email", emails);

  const porEmail = Object.fromEntries((usuarios ?? []).map((u) => [u.email, u.id]));

  const faltan = emails.filter((e) => !porEmail[e]);
  if (faltan.length) {
    console.error("Faltan usuarios demo. Ejecuta antes: npm run seed:instrumentos");
    console.error("Emails:", faltan.join(", "));
    process.exit(1);
  }

  await admin.from("publicaciones").delete().in("autor_id", Object.values(porEmail));

  console.log(`Insertando ${POSTS.length} publicaciones...\n`);

  for (const post of POSTS) {
    const autorId = porEmail[post.email];
    const { error } = await admin.from("publicaciones").insert({
      autor_id: autorId,
      contenido: post.contenido,
      tipo: post.tipo,
      fecha_evento:
        post.tipo === "show" && post.diasDesdeAhora != null
          ? fechaShow(post.diasDesdeAhora, post.hora ?? 21)
          : null,
      lugar: post.tipo === "show" ? post.lugar : null,
    });

    if (error) {
      console.error(`✗ ${post.contenido.slice(0, 40)}...`, error.message);
    } else {
      console.log(`✓ ${post.tipo === "show" ? "🎤" : "💬"} ${post.contenido.slice(0, 50)}...`);
    }
  }

  console.log("\nListo. Abre /feed en la app.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
