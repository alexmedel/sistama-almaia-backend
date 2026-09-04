import { obtenerEmociones, obtenerEmocionesPromedio } from "../src/infrestructure/server/alumno/funciones/getAlumnoDetalle";

describe("obtenerEmocionesPromedio", () => {
  it("agrupa comparativa por connotacion de emociones", async () => {
    const respuestas = [
      { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "alegría" } },
      { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "En ansiedad" } },
      { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "Enojo/Rabia" } },
      { alumno_id: 2000, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "alegría" } },
      { alumno_id: 2000, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "Calma" } },
    ];
    const emociones = [
      { nombre: "Alegría", conotacion: "Positiva" },
      { nombre: "Ansiedad", conotacion: "Negativa" },
      { nombre: "Enojo", conotacion: "Negativa" },
      { nombre: "Tranquilidad", conotacion: "Positiva" },
    ];

    const client = {
      from: jest.fn((table: string) => {
        if (table === "alumnos_respuestas_seleccion") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: respuestas, error: null }),
          };
        }
        if (table === "emociones") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: emociones, error: null }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any;

    await expect(obtenerEmocionesPromedio(client, "1611", "0")).resolves.toEqual([
      {
        nombre: "Negativa",
        cantidad_alumno: 2,
        proporcion_alumno: 0.6667,
        porcentaje_alumno: 66.67,
        cantidad_global: 2,
        proporcion_global: 0.4,
        porcentaje_global: 40,
      },
      {
        nombre: "Positiva",
        cantidad_alumno: 1,
        proporcion_alumno: 0.3333,
        porcentaje_alumno: 33.33,
        cantidad_global: 3,
        proporcion_global: 0.6,
        porcentaje_global: 60,
      },
    ]);
  });

  it("agrupa emociones del alumno por connotacion", async () => {
    const respuestas = [
      { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "alegria" } },
      { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "En ansiedad" } },
      { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "Enojo/Rabia" } },
      { alumno_id: 2000, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "alegria" } },
    ];
    const emociones = [
      { nombre: "Alegria", conotacion: "Positiva" },
      { nombre: "Ansiedad", conotacion: "Negativa" },
      { nombre: "Enojo", conotacion: "Negativa" },
    ];

    const client = {
      from: jest.fn((table: string) => {
        if (table === "alumnos_respuestas_seleccion") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: respuestas, error: null }),
          };
        }
        if (table === "emociones") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: emociones, error: null }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any;

    await expect(obtenerEmociones(client, "1611", "0")).resolves.toEqual([
      { nombre: "Negativa", cantidad: 2 },
      { nombre: "Positiva", cantidad: 1 },
    ]);
  });
});
