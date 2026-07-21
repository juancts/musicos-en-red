const SITIO_URL = "https://musicosenred.com";

export function emailBienvenidaSuscripcion(nombre: string | null | undefined) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";

  const subject = "¡Gracias por suscribirte a Músicos en Red! 🎸";

  const html = `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f3f4f6;">
            <tr>
              <td style="padding:32px 32px 24px 32px;text-align:center;">
                <div style="width:48px;height:48px;border-radius:12px;background-color:#059669;display:inline-block;line-height:48px;color:#ffffff;font-size:20px;font-weight:600;">
                  ♪
                </div>
                <p style="margin:16px 0 0 0;font-size:14px;font-weight:600;color:#111827;">Músicos en Red</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:20px;color:#111827;">${saludo}</h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                  ¡Gracias por suscribirte! Tu suscripción ya está activa y a partir de ahora tienes:
                </p>
                <ul style="margin:0 0 24px 0;padding-left:20px;font-size:14px;line-height:1.8;color:#4b5563;">
                  <li>Destacado en los resultados de búsqueda</li>
                  <li>Insignia de suscriptor visible en tu perfil</li>
                  <li>Sin límite de anuncios de instrumentos activos</li>
                </ul>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px;background-color:#059669;">
                      <a href="${SITIO_URL}/perfil" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Ir a mi perfil
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  Puedes gestionar o cancelar tu suscripción cuando quieras desde tu perfil.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#9ca3af;">
            Músicos en Red · <a href="${SITIO_URL}" style="color:#9ca3af;">musicosenred.com</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  return { subject, html };
}
