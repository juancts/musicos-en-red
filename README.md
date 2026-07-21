# musicos-en-red
Comunidad de músicos online

## Comenzando

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) con tu navegador para ver el resultado.

## Deploy de migraciones de Supabase

Las migraciones viven en `supabase/migrations/` y se aplican de forma manual desde el panel SQL Editor de Supabase en producción.

### Flujo recomendado

1. Abre tu proyecto en Supabase.
2. Ve a `SQL Editor`.
3. Crea una nueva query.
4. Pega el contenido del archivo SQL nuevo.
5. Ejecuta la query en el proyecto de producción.
6. Verifica en la base de datos que las tablas/políticas creadas estén presentes.

### Orden recomendado

- `001_salas_ensayo.sql`
- `002_mensajes.sql`
- `003_centro_multiespacio.sql`
- `004_instrumentos_marketplace.sql`
- `005_feed_publicaciones.sql`
- `006_feed_likes_comentarios.sql`
- `007_solicitudes_reserva_salas.sql`
- `008_supabase_security_hardening.sql`
- `009_usuarios_perfil_ampliado.sql`
- `010_avatar_storage.sql`
- `011_moderacion.sql`
- `012_suscripciones.sql`

> Importante: si agregas una migración nueva, aplícala también al proyecto de producción antes de hacer cualquier lanzamiento.

## Suscripción de pago (Stripe)

La suscripción (`/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`) usa las variables `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `STRIPE_PRICE_ID` (ver `.env.example`). Requiere también `SUPABASE_SERVICE_ROLE_KEY` en el entorno del servidor (Netlify incluido, no solo local).

Para probar el webhook en local:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copia el `whsec_...` que imprime el comando en `STRIPE_WEBHOOK_SECRET` de tu `.env.local` y reinicia `npm run dev`. Usa la tarjeta de prueba `4242 4242 4242 4242` para completar un checkout real en modo test.
