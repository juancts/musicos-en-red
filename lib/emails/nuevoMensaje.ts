const SITIO_URL = "https://musicosenred.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailNuevoMensaje(params: {
  remitenteNombre: string | null;
  destinatarioNombre: string | null;
  cuerpo: string;
  conversacionId: string;
}) {
  const { remitenteNombre, destinatarioNombre, cuerpo, conversacionId } = params;

  const remitente = remitenteNombre || "Alguien";
  const saludo = destinatarioNombre ? `Hola ${destinatarioNombre},` : "Hola,";
  const enlace = `${SITIO_URL}/mensajes?c=${conversacionId}`;

  const subject = `${remitente} te ha escrito un mensaje en Músicos en Red`;

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
                  &#9834;
                </div>
                <p style="margin:16px 0 0 0;font-size:14px;font-weight:600;color:#111827;">Músicos en Red</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:20px;color:#111827;">${saludo}</h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                  <strong>${escapeHtml(remitente)}</strong> te ha escrito:
                </p>
                <div style="margin:0 0 24px 0;padding:14px 16px;border-radius:12px;background-color:#f9fafb;border:1px solid #f3f4f6;font-size:14px;line-height:1.6;color:#374151;">
                  ${escapeHtml(cuerpo)}
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px;background-color:#059669;">
                      <a href="${enlace}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Responder
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  Puedes desactivar estos avisos por email desde tu perfil cuando quieras.
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
