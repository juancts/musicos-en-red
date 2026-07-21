import { describe, expect, it } from "vitest";
import {
  codigoPostalValido,
  normalizarCodigoPostal,
  provinciaDesdeCodigoPostal,
} from "../ubicacion";

describe("normalizarCodigoPostal", () => {
  it("elimina caracteres no numéricos", () => {
    expect(normalizarCodigoPostal("28-001 a")).toBe("28001");
  });

  it("trunca a 5 dígitos", () => {
    expect(normalizarCodigoPostal("2800123")).toBe("28001");
  });
});

describe("codigoPostalValido", () => {
  it("acepta un código postal real de 5 dígitos", () => {
    expect(codigoPostalValido("28001")).toBe(true);
    expect(codigoPostalValido("08001")).toBe(true);
  });

  it("rechaza prefijos de provincia inexistentes", () => {
    expect(codigoPostalValido("99001")).toBe(false);
    expect(codigoPostalValido("00001")).toBe(false);
  });

  it("rechaza formatos inválidos", () => {
    expect(codigoPostalValido("2800")).toBe(false);
    expect(codigoPostalValido("280011")).toBe(false);
    expect(codigoPostalValido("abcde")).toBe(false);
  });
});

describe("provinciaDesdeCodigoPostal", () => {
  it("devuelve la provincia correcta", () => {
    expect(provinciaDesdeCodigoPostal("28001")).toBe("Madrid");
    expect(provinciaDesdeCodigoPostal("08001")).toBe("Barcelona");
  });

  it("devuelve cadena vacía si el prefijo no existe", () => {
    expect(provinciaDesdeCodigoPostal("99001")).toBe("");
  });
});
