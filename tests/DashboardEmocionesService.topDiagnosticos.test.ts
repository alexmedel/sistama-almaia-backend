const rpcMock = jest.fn();
const formatResponseMock = jest.fn();
const handleErrorMock = jest.fn();

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: () => ({
      rpc: rpcMock,
    }),
  })),
}));

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: (...args: any[]) => formatResponseMock(...args),
}));

jest.mock("../src/helpers/ErrorResponse", () => ({
  errorHandler: {
    handleError: (...args: any[]) => handleErrorMock(...args),
  },
}));

import { DashboardEmocionesService } from "../src/infrestructure/server/dashboard/dashboardEmocionesService";

describe("DashboardEmocionesService.obtenerTopDiagnosticosPorTipo", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    formatResponseMock.mockReset();
    handleErrorMock.mockReset();
  });

  it("returns master emotion connotation and color in payload", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          diagnostico: "Alegría",
          conotacion_emocion: "Positiva",
          respuestas_positivas: 0,
          respuestas_neutras: 0,
          respuestas_negativas: 3,
          color: "#FBC02D",
          total_respuestas: 3,
          cantidad_preguntas: 2,
        },
      ],
      error: null,
    });

    const req = {
      query: {
        tipo: "positivo",
        colegio_id: "0",
        fecha: "2026-06-10",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await DashboardEmocionesService.obtenerTopDiagnosticosPorTipo(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_por_connotacion_emocion",
      {
        p_limit: 5,
        p_conotaciones: ["Positiva"],
        p_fecha: "2026-06-10",
        p_colegio_id: 0,
      }
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, [
      {
        nombre: "Alegría",
        positivos: 0,
        negativos: 3,
        neutrales: 0,
        conotacion: "Positiva",
        color: "#FBC02D",
        total: 3,
        cantidad_preguntas: 2,
      },
    ]);
  });

  it("filters negative request by master negative connotation only", async () => {
    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    });

    const req = {
      query: {
        tipo: "negativo",
        colegio_id: "0",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await DashboardEmocionesService.obtenerTopDiagnosticosPorTipo(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_por_connotacion_emocion",
      expect.objectContaining({
        p_conotaciones: ["Negativa"],
        p_colegio_id: 0,
      })
    );
  });

  it("filters neutral request by master neutral connotation only", async () => {
    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    });

    const req = {
      query: {
        tipo: "neutro",
        colegio_id: "0",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await DashboardEmocionesService.obtenerTopDiagnosticosPorTipo(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_por_connotacion_emocion",
      expect.objectContaining({
        p_conotaciones: ["Neutra"],
        p_colegio_id: 0,
      })
    );
  });
});

describe("AlumnosService.getTopEmocionesAlumno", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    formatResponseMock.mockReset();
    handleErrorMock.mockReset();
  });

  it("returns top negative-connotation emotions for one student within range", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          diagnostico: "Enojo/Rabia",
          conotacion_emocion: "Negativa",
          color: "#E53935",
          total_respuestas: 7,
          respuestas_positivas: 4,
          respuestas_neutras: 1,
          respuestas_negativas: 2,
          cantidad_preguntas: 2,
        },
      ],
      error: null,
    });

    const { AlumnosService } = await import("../src/infrestructure/server/alumno/AlumnoService");
    const req = {
      params: { alumnoId: "1610" },
      query: {
        tipo: "negativo",
        colegio_id: "0",
        fecha_desde: "2025-06-01",
        fecha_hasta: "2026-06-12",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await AlumnosService.getTopEmocionesAlumno(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_alumno_por_connotacion_emocion",
      {
        p_alumno_id: 1610,
        p_limit: 5,
        p_conotaciones: ["Negativa"],
        p_fecha_desde: "2025-06-01",
        p_fecha_hasta: "2026-06-12",
        p_colegio_id: 0,
      }
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, [
      {
        nombre: "Enojo/Rabia",
        total: 7,
        positivos: 4,
        neutrales: 1,
        negativos: 2,
        conotacion: "Negativa",
        color: "#E53935",
        cantidad_preguntas: 2,
      },
    ]);
  });

  it("returns top neutral-connotation emotions for one student within range", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          diagnostico: "Sorpresa",
          conotacion_emocion: "Neutra",
          color: "#90A4AE",
          total_respuestas: 2,
          respuestas_positivas: 0,
          respuestas_neutras: 2,
          respuestas_negativas: 0,
          cantidad_preguntas: 2,
        },
      ],
      error: null,
    });

    const { AlumnosService } = await import("../src/infrestructure/server/alumno/AlumnoService");
    const req = {
      params: { alumnoId: "1610" },
      query: {
        tipo: "neutro",
        colegio_id: "0",
        fecha_desde: "2025-06-01",
        fecha_hasta: "2026-06-12",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await AlumnosService.getTopEmocionesAlumno(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_alumno_por_connotacion_emocion",
      expect.objectContaining({
        p_conotaciones: ["Neutra"],
      })
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, [
      {
        nombre: "Sorpresa",
        total: 2,
        positivos: 0,
        neutrales: 2,
        negativos: 0,
        conotacion: "Neutra",
        color: "#90A4AE",
        cantidad_preguntas: 2,
      },
    ]);
  });

  it("returns top positive-connotation emotions for one student within range", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          diagnostico: "Alegría",
          conotacion_emocion: "Positiva",
          color: "#FBC02D",
          total_respuestas: 5,
          respuestas_positivas: 3,
          respuestas_neutras: 1,
          respuestas_negativas: 1,
          cantidad_preguntas: 5,
        },
      ],
      error: null,
    });

    const { AlumnosService } = await import("../src/infrestructure/server/alumno/AlumnoService");
    const req = {
      params: { alumnoId: "1610" },
      query: {
        tipo: "positivo",
        colegio_id: "0",
        fecha_desde: "2025-06-01",
        fecha_hasta: "2026-06-12",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await AlumnosService.getTopEmocionesAlumno(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_alumno_por_connotacion_emocion",
      expect.objectContaining({
        p_conotaciones: ["Positiva"],
      })
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, [
      {
        nombre: "Alegría",
        total: 5,
        positivos: 3,
        neutrales: 1,
        negativos: 1,
        conotacion: "Positiva",
        color: "#FBC02D",
        cantidad_preguntas: 5,
      },
    ]);
  });
});

describe("AlumnosService top diagnosticos por tipo concepto", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    formatResponseMock.mockReset();
    handleErrorMock.mockReset();
  });

  it("returns top patologias for one student within range", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          diagnostico: "Bullying",
          color: "#D81B60",
          total_respuestas: 6,
          respuestas_positivas: 4,
          respuestas_neutras: 1,
          respuestas_negativas: 1,
          cantidad_preguntas: 6,
        },
      ],
      error: null,
    });

    const { AlumnosService } = await import("../src/infrestructure/server/alumno/AlumnoService");
    const req = {
      params: { alumnoId: "1610" },
      query: {
        colegio_id: "0",
        fecha_desde: "2025-06-01",
        fecha_hasta: "2026-06-12",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await AlumnosService.getTopPatologiasAlumno(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_alumno_por_tipo_concepto",
      {
        p_alumno_id: 1610,
        p_limit: 5,
        p_tipo_concepto: "Patologica",
        p_fecha_desde: "2025-06-01",
        p_fecha_hasta: "2026-06-12",
        p_colegio_id: 0,
      }
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, [
      {
        nombre: "Bullying",
        total: 6,
        positivos: 4,
        neutrales: 1,
        negativos: 1,
        color: "#D81B60",
        cantidad_preguntas: 6,
      },
    ]);
  });

  it("returns top neurodivergencias for one student within range", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          diagnostico: "TDAH (Impulsiv.)",
          color: "#C62828",
          total_respuestas: 5,
          respuestas_positivas: 3,
          respuestas_neutras: 1,
          respuestas_negativas: 1,
          cantidad_preguntas: 5,
        },
      ],
      error: null,
    });

    const { AlumnosService } = await import("../src/infrestructure/server/alumno/AlumnoService");
    const req = {
      params: { alumnoId: "1610" },
      query: {
        colegio_id: "0",
        fecha_desde: "2025-06-01",
        fecha_hasta: "2026-06-12",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await AlumnosService.getTopNeurodivergenciasAlumno(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "top_diagnosticos_alumno_por_tipo_concepto",
      {
        p_alumno_id: 1610,
        p_limit: 5,
        p_tipo_concepto: "Neurodivergencia",
        p_fecha_desde: "2025-06-01",
        p_fecha_hasta: "2026-06-12",
        p_colegio_id: 0,
      }
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, [
      {
        nombre: "TDAH (Impulsiv.)",
        total: 5,
        positivos: 3,
        neutrales: 1,
        negativos: 1,
        color: "#C62828",
        cantidad_preguntas: 5,
      },
    ]);
  });
});

describe("AlumnosService.getComparativaEmocionesAlumno", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    formatResponseMock.mockReset();
    handleErrorMock.mockReset();
  });

  it("returns comparative payload for selected emotions using curso scope by default", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          emocion: "Aceptación",
          conotacion_emocion: "Positiva",
          color: "#4CAF50",
          alumno_total: 5,
          grupo_promedio: 3,
          diferencia: 2,
          scope_tipo: "curso",
          scope_id: 54,
          scope_nombre: "Grado AlmaIA",
          curso_id: 54,
          grado_id: 22,
          nivel_educativo_id: 9,
        },
        {
          emocion: "Enojo/Rabia",
          conotacion_emocion: "Negativa",
          color: "#E53935",
          alumno_total: 4,
          grupo_promedio: 4.5,
          diferencia: -0.5,
          scope_tipo: "curso",
          scope_id: 54,
          scope_nombre: "Grado AlmaIA",
          curso_id: 54,
          grado_id: 22,
          nivel_educativo_id: 9,
        },
      ],
      error: null,
    });

    const { AlumnosService } = await import("../src/infrestructure/server/alumno/AlumnoService");
    const req = {
      params: { alumnoId: "1610" },
      query: {
        colegio_id: "0",
        emociones: "Aceptación,Calma,Enojo/Rabia,Tristeza",
        fecha_desde: "2025-06-01",
        fecha_hasta: "2026-06-12",
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await AlumnosService.getComparativaEmocionesAlumno(req, res);

    expect(rpcMock).toHaveBeenCalledWith(
      "comparativa_emociones_alumno",
      {
        p_alumno_id: 1610,
        p_colegio_id: 0,
        p_emociones: ["Aceptación", "Calma", "Enojo/Rabia", "Tristeza"],
        p_fecha_desde: "2025-06-01",
        p_fecha_hasta: "2026-06-12",
        p_scope: "curso",
        p_peso_objetivo: 0,
      }
    );

    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, {
      alumno_id: 1610,
      scope: "curso",
      contexto: {
        colegio_id: 0,
        curso_id: 54,
        grado_id: 22,
        nivel_educativo_id: 9,
        scope_id: 54,
        scope_nombre: "Grado AlmaIA",
      },
      tipo_respuesta: {
        codigo: 0,
        nombre: "positiva",
      },
      items: [
        {
          emocion: "Aceptación",
          conotacion: "Positiva",
          color: "#4CAF50",
          alumno: 5,
          promedio: 3,
          diferencia: 2,
        },
        {
          emocion: "Enojo/Rabia",
          conotacion: "Negativa",
          color: "#E53935",
          alumno: 4,
          promedio: 4.5,
          diferencia: -0.5,
        },
      ],
    });
  });
});
