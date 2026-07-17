# Checklist de lanzamiento — Músicos en Red

Auditoría realizada el 2026-07-17. Estado del código base antes de abrir la app al público.

## 1. Bloqueantes (resolver antes de abrir al público)

- [ ] **Páginas legales**: Términos, Privacidad y Contacto están enlazadas a `#` en `components/layout/Footer.tsx:19-21`. No existe ninguna página real en `app/`.
  - Crear `app/terminos/page.tsx`, `app/privacidad/page.tsx`, `app/contacto/page.tsx` (o una página de contacto con formulario/email).
  - Necesario sobre todo por: cuentas de usuario, mensajería privada, marketplace de instrumentos, datos de ubicación.
  - Actualizar los `href="#"` del footer a las rutas reales.

- [x] **Recuperar contraseña**: implementado. `lib/auth.ts` ahora tiene `resetPasswordForEmail` y `updatePassword`, con páginas `app/recuperar-password/page.tsx` y `app/actualizar-password/page.tsx`. El link del login ya apunta a `/recuperar-password`.
  - ⚠️ **Pendiente de configuración manual**: en Supabase → Authentication → URL Configuration → Redirect URLs, añadir `https://TU-DOMINIO/actualizar-password` (y `http://localhost:3000/actualizar-password` para desarrollo). Sin esto el link del email de recuperación no funcionará en producción.

- [ ] **Moderación básica**: no existe ninguna forma de reportar o bloquear usuarios/contenido (feed, mensajes, anuncios de instrumentos, salas).
  - Mínimo viable: botón "Reportar" en publicaciones del feed y en perfiles, que guarde el reporte en una tabla `reportes` de Supabase para revisión manual.
  - Opción de bloquear usuario en mensajería para cortar el contacto.

## 2. Importantes (idealmente antes del lanzamiento, pueden ir en los primeros días)

- [ ] **SEO y metadata**: ninguna página exporta `metadata` de Next.js (sin `title`, `description`, OpenGraph). No hay `robots.txt` ni `sitemap.xml`.
  - Añadir `metadata` en `app/layout.tsx` (título/descripción por defecto) y overrides por página clave (`/feed`, `/explorar`, `/salas`, `/instrumentos`).
  - Generar `robots.txt` y `sitemap.xml` (Next soporta `app/robots.ts` y `app/sitemap.ts`).
  - Añadir imagen OpenGraph para que los links compartidos en WhatsApp/redes se vean bien.

- [ ] **Estados de carga y error**: no hay `loading.tsx` / `error.tsx` / `not-found.tsx` en ninguna ruta de `app/`. El manejo de errores de Supabase es ad-hoc y no cubre todas las páginas.
  - Añadir `loading.tsx` y `error.tsx` al menos en `feed`, `explorar`, `salas`, `instrumentos`, `mensajes`.
  - Revisar que ninguna pantalla quede en blanco si Supabase falla.

- [ ] **Analítica**: no hay ningún tracking instalado (GA, Plausible, PostHog...).
  - Elegir una herramienta ligera (recomendado Plausible o GA4) para saber de dónde vienen los usuarios y qué páginas/acciones usan.

- [ ] **Migraciones de base de datos manuales**: las 10 migraciones en `supabase/migrations/` se aplican a mano vía SQL Editor, sin pipeline automatizado. Riesgo de que producción y entornos de desarrollo se desincronicen.
  - Como mínimo, documentar en el README el proceso exacto para aplicar migraciones nuevas en producción.

## 3. Limpieza menor

- [ ] `lib/salesforce.ts` está vacío y sin usar — decidir si se implementa o se borra.
- [ ] Confirmar que el modelo de "solo contacto" (sin pago dentro de la app) para `salas` e `instrumentos` es el deseado para el lanzamiento — actualmente es así por diseño, no por limitación técnica.

## 4. No bloqueante, pero recomendable pronto después de lanzar

- [ ] Tests automatizados: hoy no hay ningún test (`package.json` solo tiene scripts de dev/build/lint/seed).
- [ ] Verificación de email en el registro (confirmar si Supabase la tiene activada y si el flujo post-registro está claro para el usuario).

---

### Orden sugerido de trabajo

1. Recuperar contraseña (rápido, Supabase ya trae la función — solo falta UI).
2. Páginas legales (Términos/Privacidad/Contacto) + actualizar footer.
3. Reportar/bloquear básico.
4. Metadata + robots.txt + sitemap.
5. loading/error states en rutas principales.
6. Analítica.
7. Resto de limpieza y automatización de migraciones.
