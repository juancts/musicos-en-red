import { DATOS_LEGALES } from "@/lib/legal";

export const metadata = {
  title: "Política de privacidad · Músicos en Red",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Política de privacidad</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">Última actualización: 17 de julio de 2026</p>

      <div className="space-y-8 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">1. Responsable del tratamiento</h2>
          <p>
            {DATOS_LEGALES.nombreResponsable}
            {DATOS_LEGALES.nif ? `, NIF ${DATOS_LEGALES.nif}` : ""}
            {DATOS_LEGALES.domicilio ? `, con domicilio en ${DATOS_LEGALES.domicilio}` : ""}, es
            el responsable del tratamiento de los datos personales recogidos a través de Músicos
            en Red. Puedes contactar en{" "}
            <a href={`mailto:${DATOS_LEGALES.email}`} className="text-emerald-600 hover:underline">
              {DATOS_LEGALES.email}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">2. Qué datos recopilamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Cuenta:</strong> email y contraseña, o email, nombre y foto si te registras
              con Google.
            </li>
            <li>
              <strong>Perfil de músico:</strong> nombre, biografía, instrumento, géneros
              musicales, ciudad, provincia, código postal, foto de perfil y, si eliges mostrarlos,
              email o teléfono de contacto público.
            </li>
            <li>
              <strong>Perfil de sala de ensayo:</strong> nombre del local, dirección, ciudad,
              código postal, teléfono, precios, equipamiento y horarios.
            </li>
            <li>
              <strong>Contenido publicado:</strong> publicaciones del feed, comentarios, likes y
              anuncios de instrumentos, incluidas las imágenes que subas.
            </li>
            <li>
              <strong>Mensajes:</strong> el contenido de las conversaciones privadas entre
              usuarios de la plataforma.
            </li>
            <li>
              <strong>Datos técnicos:</strong> información básica de uso del servicio necesaria
              para su funcionamiento (por ejemplo, la sesión de acceso).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">3. Para qué usamos tus datos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Crear y gestionar tu cuenta y tu perfil público.</li>
            <li>Mostrar tu perfil a otros usuarios cuando buscan músicos, salas o instrumentos.</li>
            <li>Permitir el envío y recepción de mensajes entre usuarios.</li>
            <li>Publicar y mostrar tu contenido en el feed.</li>
            <li>Mantener la seguridad de la plataforma y prevenir usos indebidos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">4. Base legal</h2>
          <p>
            Tratamos tus datos en base a la ejecución del contrato de uso del servicio (los
            términos que aceptas al registrarte) y, en el caso de los datos de contacto que
            decides hacer públicos, tu consentimiento explícito al activarlos desde tu perfil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">5. Con quién compartimos tus datos</h2>
          <p className="mb-2">
            No vendemos tus datos. Los compartimos únicamente con los proveedores necesarios para
            operar la plataforma, que actúan como encargados del tratamiento:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase</strong> (base de datos, autenticación y almacenamiento de
              imágenes).
            </li>
            <li>
              <strong>Google</strong>, únicamente si eliges iniciar sesión con tu cuenta de
              Google.
            </li>
          </ul>
          <p className="mt-2">
            Tu perfil (nombre, instrumento, ciudad, bio, foto) es visible públicamente para otros
            usuarios de la plataforma como parte del funcionamiento del servicio. Los datos de
            contacto directo (email, teléfono) solo se muestran si activas esa opción en tu
            perfil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">6. Conservación</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si la eliminas, borraremos o
            anonimizaremos tus datos personales, salvo que debamos conservar algún dato por
            obligación legal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">7. Tus derechos</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición,
            limitación y portabilidad escribiendo a{" "}
            <a href={`mailto:${DATOS_LEGALES.email}`} className="text-emerald-600 hover:underline">
              {DATOS_LEGALES.email}
            </a>
            . También puedes editar o eliminar directamente gran parte de tu información desde tu
            perfil. Si consideras que no hemos atendido tu solicitud correctamente, puedes
            reclamar ante la Agencia Española de Protección de Datos (aepd.es).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">8. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas razonables para proteger tus datos, incluyendo control de
            acceso a nivel de base de datos. Ningún sistema es 100% seguro, por lo que no podemos
            garantizar una seguridad absoluta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">9. Menores de edad</h2>
          <p>
            La plataforma no está dirigida a menores de 16 años. Si detectamos una cuenta de un
            menor de esa edad, procederemos a eliminarla.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">10. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política para reflejar cambios en el servicio o en la
            normativa aplicable. Publicaremos la fecha de la última actualización al inicio de
            esta página.
          </p>
        </section>
      </div>
    </div>
  );
}
