import { DATOS_LEGALES } from "@/lib/legal";

export const metadata = {
  title: "Términos y condiciones · Músicos en Red",
};

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Términos y condiciones de uso</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: 24 de julio de 2026</p>

      <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Objeto</h2>
          <p>
            Estos términos regulan el acceso y uso de Músicos en Red (en adelante, &quot;la
            plataforma&quot;), un servicio operado por {DATOS_LEGALES.nombreResponsable} que
            permite a músicos conectar entre sí, publicar contenido en un feed, buscar y
            contactar con otros músicos, alquilar salas de ensayo y comprar o vender
            instrumentos de segunda mano.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Aceptación</h2>
          <p>
            Al registrarte o usar la plataforma aceptas estos términos y nuestra{" "}
            <a href="/privacidad" className="text-emerald-600 hover:underline">
              Política de Privacidad
            </a>
            . Si no estás de acuerdo, no debes usar el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Registro y cuenta</h2>
          <p>
            Para usar la mayoría de funciones necesitas crear una cuenta con email y contraseña,
            o mediante tu cuenta de Google. Eres responsable de mantener la confidencialidad de
            tus credenciales y de toda actividad realizada desde tu cuenta. Debes proporcionar
            información veraz y mantenerla actualizada.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Uso del servicio</h2>
          <p className="mb-2">
            La plataforma facilita el contacto entre usuarios, pero no interviene en los acuerdos
            que estos alcancen entre sí. En concreto:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Las reservas de salas de ensayo son solicitudes de contacto; el precio, el pago y
              las condiciones se acuerdan directamente entre el músico y el centro.
            </li>
            <li>
              Los anuncios de instrumentos son publicaciones informativas; la compraventa, el pago
              y la entrega se acuerdan directamente entre comprador y vendedor.
            </li>
          </ul>
          <p className="mt-2">
            Músicos en Red no es parte de estas transacciones, no garantiza la identidad,
            solvencia o buena fe de los usuarios, y no se hace responsable de los acuerdos
            alcanzados entre ellos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Suscripción de pago</h2>
          <p className="mb-2">
            Músicos en Red ofrece una suscripción opcional de pago (actualmente 2,99 €/mes,
            impuestos incluidos) que otorga beneficios adicionales: destacado en los resultados
            de búsqueda, insignia de suscriptor, publicación de anuncios de instrumentos sin
            límite, y la posibilidad de dar de alta salas de ensayo propias más allá del límite
            gratuito.
          </p>
          <p className="mb-2">
            La suscripción se cobra de forma recurrente y se renueva automáticamente cada mes
            hasta que la canceles. El pago se procesa a través de Stripe, Inc.; Músicos en Red no
            almacena los datos de tu tarjeta. Puedes cancelar en cualquier momento desde tu
            perfil; la cancelación se hace efectiva al final del periodo ya pagado, sin cargos
            adicionales.
          </p>
          <p>
            Al tratarse de un servicio digital cuyos beneficios (destacado, insignia, límites
            ampliados) se activan de forma inmediata al confirmarse el pago, y siempre que hayas
            dado tu consentimiento expreso a ello antes de suscribirte, aceptas que pierdes el
            derecho de desistimiento de 14 días previsto en la normativa de consumidores en
            cuanto el servicio comienza a prestarse, conforme al artículo 103.m) del Real Decreto
            Legislativo 1/2007.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contenido de los usuarios</h2>
          <p>
            Eres el único responsable del contenido que publiques (perfil, publicaciones del
            feed, anuncios, mensajes, imágenes). Al publicar, garantizas que tienes los derechos
            necesarios sobre ese contenido y nos concedes una licencia no exclusiva para
            mostrarlo dentro de la plataforma con el fin de prestar el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Conducta prohibida</h2>
          <p className="mb-2">No está permitido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Publicar contenido ilegal, difamatorio, discriminatorio o que suplante a terceros.</li>
            <li>Acosar, amenazar o spamear a otros usuarios.</li>
            <li>Publicar anuncios de artículos ilegales o robados.</li>
            <li>Usar la plataforma con fines fraudulentos o para eludir estos términos.</li>
          </ul>
          <p className="mt-2">
            Podemos suspender o eliminar cuentas y contenido que incumplan estas normas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Propiedad intelectual</h2>
          <p>
            El nombre, la marca, el diseño y el código de la plataforma pertenecen a{" "}
            {DATOS_LEGALES.nombreResponsable}, salvo el contenido publicado por los usuarios, que
            sigue siendo propiedad de estos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Limitación de responsabilidad</h2>
          <p>
            El servicio se presta &quot;tal cual&quot; y en fase beta. No garantizamos
            disponibilidad continua ni ausencia de errores. En la medida permitida por la ley, no
            somos responsables de daños derivados del uso de la plataforma o de los acuerdos entre
            usuarios.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos para reflejar cambios en el servicio o en la
            normativa aplicable. Publicaremos la fecha de la última actualización al inicio de
            esta página.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Legislación aplicable</h2>
          <p>
            Estos términos se rigen por la legislación de {DATOS_LEGALES.pais}. Cualquier
            controversia se someterá a los juzgados y tribunales competentes conforme a dicha
            legislación.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Contacto</h2>
          <p>
            Para cualquier duda sobre estos términos, escríbenos a{" "}
            <a href={`mailto:${DATOS_LEGALES.email}`} className="text-emerald-600 hover:underline">
              {DATOS_LEGALES.email}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
