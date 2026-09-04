import { mapPatologia } from "../src/core/services/DashboardServiceCasoUso";

describe("mapPatologia", () => {
  it("preserves positive, neutral, and negative response counts", () => {
    const result = mapPatologia([
      {
        diagnostico: "Disgrafía",
        cantidad: 2,
        cantidad_respuestas: 3,
        cantidad_positivas: 1,
        cantidad_negativas: 2,
        cantidad_neutras: 0,
        color: "#5E35B1",
      },
    ]);

    expect(result[0]).toEqual({
      name: "Disgrafía",
      value: 2,
      cantidad_respuestas: 3,
      cantidad_positivas: 1,
      cantidad_negativas: 2,
      cantidad_neutras: 0,
      color: "#5E35B1",
    });
  });
});
