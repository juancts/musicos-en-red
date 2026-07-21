import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://musicosenred.com";

  return [
    "",
    "/feed",
    "/explorar",
    "/salas",
    "/instrumentos",
    "/mensajes",
    "/login",
    "/registro",
    "/contacto",
    "/privacidad",
    "/terminos",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
