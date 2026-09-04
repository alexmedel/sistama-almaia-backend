const validateMock = jest.fn(() => ({ error: null }));
const validarReferenciasMock = jest.fn().mockResolvedValue(undefined);
const procesarArchivosMock = jest.fn().mockResolvedValue(undefined);
const getDestinatariosMock = jest.fn().mockResolvedValue({
  destinatarios: ["app@almaia.cl"],
  colegio_id: 16,
});
const processDataMock = jest.fn().mockResolvedValue({
  alumno_alerta_id: 99,
  alertas_tipo_alerta_tipo_id: 1,
});
const setClientMock = jest.fn();
const enviarNotificacionMock = jest.fn().mockResolvedValue(undefined);
const guardarAuditoriaMock = jest.fn().mockResolvedValue(undefined);

const globalClient = { from: jest.fn() };
const requestClient = { from: jest.fn() };
const adminClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({
        data: [{ nombre: "SOS" }],
        error: null,
      }),
    })),
  })),
};

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: () => globalClient,
  })),
}));

jest.mock("../src/infrestructure/server/DataService", () => ({
  DataService: jest.fn().mockImplementation(() => ({
    setClient: setClientMock,
    processData: processDataMock,
  })),
}));

jest.mock("../src/infrestructure/server/alumno/shema/AlumnoAlertaSchema", () => ({
  AlumnoAlertaSchema: { validate: validateMock },
}));

jest.mock(
  "../src/infrestructure/server/alumno/funciones/AlumnoAlerta/AlumnoAlertaBusiness",
  () => ({
    validarReferencias: validarReferenciasMock,
    procesarArchivos: procesarArchivosMock,
    getDestinatarios: getDestinatariosMock,
    actualizarAlumnoAlerta: jest.fn(),
  })
);

jest.mock("../src/core/services/EmailService", () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    enviarNotificacionAlerta: enviarNotificacionMock,
  })),
}));

jest.mock("../src/repos/auditoria/auditoria.service", () => ({
  AuditoriaService: jest.fn().mockImplementation(() => ({
    guardarAuditoria: guardarAuditoriaMock,
  })),
}));

jest.mock("../src/repos/auditoria/trazabilidadRepository", () => ({
  TrazabilidadRepository: jest.fn(),
}));

describe("AlumnoAlertaService.guardar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the request admin client for alert catalogs hidden by RLS", async () => {
    const { AlumnoAlertaService } = await import(
      "../src/infrestructure/server/alumno/AlumnoAlertaService"
    );
    const req: any = {
      body: {
        alumno_id: 1741,
        mensaje: "Necesito ayuda",
        alerta_origen_id: 1,
        prioridad_id: 1,
        severidad_id: 1,
        leida: false,
        estado: "pendiente",
        alertas_tipo_alerta_tipo_id: 1,
      },
      creado_por: 4862,
      actualizado_por: 4862,
      supabase: requestClient,
      supabaseAdmin: adminClient,
      ip: "127.0.0.1",
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await AlumnoAlertaService.guardar(req, res);

    expect(validarReferenciasMock).toHaveBeenCalledWith(
      adminClient,
      expect.objectContaining({ alerta_origen_id: 1 })
    );
    expect(getDestinatariosMock).toHaveBeenCalledWith(adminClient, 1741, 1);
    expect(setClientMock).toHaveBeenCalledWith(requestClient);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
