# Checklist de lanzamiento — Músicos en Red

Auditoría realizada el 2026-07-17. Estado del código base antes de abrir la app al público.

## 1. Bloqueantes (resolver antes de abrir al público)

- [x] **Páginas legales**: creadas `app/terminos/page.tsx`, `app/privacidad/page.tsx` y `app/contacto/page.tsx`, enlazadas desde el footer. Los datos del responsable (nombre, email, NIF, domicilio, dominio) están centralizados en `lib/legal.ts`.
  - ⚠️ **Pendiente**: `lib/legal.ts` tiene datos provisionales (`contacto@musicosenred.com`, dominio `musicosenred.com`, sin NIF ni domicilio). Actualizar ese archivo en cuanto tengas el dominio real, la razón social definitiva y (si aplica) el NIF/CIF y domicilio fiscal — se propaga automáticamente a las 3 páginas.
  - Recomendable que un abogado revise el texto antes de escalar más allá de un beta cerrado, especialmente la política de privacidad (RGPD).

- [x] **Recuperar contraseña**: implementado. `lib/auth.ts` ahora tiene `resetPasswordForEmail` y `updatePassword`, con páginas `app/recuperar-password/page.tsx` y `app/actualizar-password/page.tsx`. El link del login ya apunta a `/recuperar-password`.
  - Configuración manual completada (2026-07-21): Site URL en Supabase = `https://musicosenred.com`, y `https://musicosenred.com/**` añadido a Redirect URLs (antes la lista estaba vacía, lo que también afectaba el login con Google).

- [x] **Moderación básica**: ya existe un flujo mínimo de reportar y bloquear usuarios/contenido en feed, perfiles y mensajes. La lógica está en `lib/moderacion.ts`, con botones en `components/moderacion/ReportarButton.tsx` y `components/moderacion/BloquearUsuarioButton.tsx`.
  - El flujo de reportes guarda entradas en la tabla `reportes` de Supabase y el bloqueo impide nuevos mensajes entre usuarios.
  - ✅ Migración `011_moderacion.sql` ya aplicada en producción (2026-07-21) — tablas `reportes`/`bloqueos` y políticas RLS activas.
  - **Cómo moderar hoy**: no hay panel admin en la app ni rol admin — la RLS solo deja a cada usuario ver sus propios reportes. Revisar reportes entrantes directamente en Supabase → Table Editor → tabla `reportes` (el dashboard usa el service role, no le aplica RLS). Para suspender una cuenta, usar Authentication → Users en Supabase. Construir un panel `/admin` es una mejora futura, no bloqueante.

## 2. Importantes (idealmente antes del lanzamiento, pueden ir en los primeros días)

- [x] **SEO y metadata**: `app/layout.tsx` exporta `metadata` (title template, description, OpenGraph, Twitter card). Añadidos `app/robots.ts` y `app/sitemap.ts`.
  - ⚠️ **Pendiente**: no hay imagen OpenGraph propia (og:image) — de momento se usa el fallback por defecto de cada red al compartir. Añadir una imagen 1200x630 cuando haya diseño final.
  - ✅ Confirmado (2026-07-21): el dominio real es `musicosenred.com` (ya activo en Netlify), coincide con lo ya puesto en `metadataBase`, `robots.ts`, `sitemap.ts` y `lib/legal.ts` — no requiere cambios.

- [x] **Estados de carga y error**: añadidos `loading.tsx` y `error.tsx` en `feed`, `explorar`, `salas`, `instrumentos`, `mensajes`.
  - No se añadió `not-found.tsx` dedicado (usa el 404 por defecto de Next).

- [x] **Analítica**: integrado Plausible vía `components/analytics/PlausibleAnalytics.tsx` (se monta en `app/layout.tsx`), solo se activa si hay variables de entorno configuradas.
  - ⚠️ **Pendiente de configuración manual**: crear el sitio en Plausible y definir `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (y opcionalmente `NEXT_PUBLIC_PLAUSIBLE_API_HOST` si es self-hosted) en las variables de entorno de producción. Sin esto no se envía ningún tracking (fail-safe, no rompe la app).

- [x] **Migraciones de base de datos manuales**: documentado en el README el proceso y el orden recomendado para aplicar migraciones en producción vía SQL Editor. Sigue siendo manual (sin pipeline automatizado), pero al menos está documentado.

## 3. Limpieza menor

- [x] `lib/salesforce.ts` estaba vacío y sin usar — borrado (sin referencias en el resto del código).
- [x] Modelo de "solo contacto" para `salas` e `instrumentos`: confirmado que **no** es el modelo final. Se quiere añadir pagos/reservas dentro de la app más adelante (post-lanzamiento). Queda como ítem de roadmap, no bloquea el lanzamiento.

## 4. No bloqueante, pero recomendable pronto después de lanzar

- [x] Tests automatizados: configurado Vitest (`npm run test`) con tests unitarios para `lib/ubicacion.ts` y `lib/usuario.ts` en `lib/__tests__/`.
  - ⚠️ Cobertura mínima por ahora — solo funciones puras. Falta ampliar a `lib/moderacion.ts` (requiere mockear Supabase) y, si se quiere, tests de componentes o E2E (Playwright) más adelante.
  - Nota: se instaló `vitest@2` (no la v4) porque la v4 requiere Node ≥20.12 y este entorno tiene Node 20.9.0.
- [x] Verificación de email en el registro: el flujo post-registro ya es claro (`components/registro/RegistroShell.tsx` → `PantallaExito`, "Hemos enviado un enlace de confirmación a...").
  - ✅ Confirmado (2026-07-21): "Confirm email" está activado en Supabase.

---

### Orden sugerido de trabajo

1. Recuperar contraseña (ya implementado; solo falta confirmar la URL de redirect).
2. Páginas legales (Términos/Privacidad/Contacto) + actualizar footer.
3. Reportar/bloquear básico (ya implementado en código; requiere migración `011_moderacion.sql` en Supabase).
4. Metadata + robots.txt + sitemap (ya implementado; falta imagen OpenGraph y confirmar dominio final).
5. loading/error states en rutas principales (ya implementado).
6. Analítica (ya implementado; falta configurar `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` en producción).
7. Resto de limpieza (sección 3) y automatización de migraciones.
