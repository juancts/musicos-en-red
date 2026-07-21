import { describe, expect, it } from "vitest";
import { esMusico, esSala, formatearPrecioHora } from "../usuario";

describe("esSala / esMusico", () => {
  it("identifica una sala", () => {
    expect(esSala({ tipo: "sala" })).toBe(true);
    expect(esMusico({ tipo: "sala" })).toBe(false);
  });

  it("identifica un músico explícito", () => {
    expect(esSala({ tipo: "musico" })).toBe(false);
    expect(esMusico({ tipo: "musico" })).toBe(true);
  });

  it("trata tipo ausente como músico (default)", () => {
    expect(esMusico({})).toBe(true);
    expect(esMusico({ tipo: null })).toBe(true);
    expect(esSala({})).toBe(false);
  });
});

describe("formatearPrecioHora", () => {
  it("formatea un número como euros sin decimales", () => {
    expect(formatearPrecioHora(25)).toMatch(/^25\s?€$/);
  });

  it("devuelve null para valores ausentes o inválidos", () => {
    expect(formatearPrecioHora(null)).toBeNull();
    expect(formatearPrecioHora(undefined)).toBeNull();
    expect(formatearPrecioHora(NaN)).toBeNull();
  });
});
