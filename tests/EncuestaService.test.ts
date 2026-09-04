import { buildEncuestaAvisoFechaProgramacion } from "../src/infrestructure/server/encuestas/encuestaAvisoFecha";

describe("buildEncuestaAvisoFechaProgramacion", () => {
  it("combines fecha_inicio and hora_ejecucion for automatic survey notices", () => {
    expect(
      buildEncuestaAvisoFechaProgramacion({
        fecha_inicio: "2026-05-29",
        hora_ejecucion: "21:59:00",
      })
    ).toBe("2026-05-29T21:59:00.000");
  });
});
