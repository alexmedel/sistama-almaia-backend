import {
  buildNotificacionUsuarioUpdates,
  UsuarioNotificacionPendiente,
} from "../src/infrestructure/server/avisosApps/services/NotificacionProgramadaSender";

describe("buildNotificacionUsuarioUpdates", () => {
  const now = new Date("2026-05-28T10:00:00.000Z");

  const basePending: UsuarioNotificacionPendiente = {
    usuario_notificacion_id: 10,
    aviso_id: 5,
    usuario_id: 99,
    expo_push_token: "ExponentPushToken[test]",
    aviso_titulo: "Encuesta disponible",
    aviso_contenido: "Responde la encuesta",
    cantidad_intentos: 1,
  };

  test("marks every pending user notification as sent when push succeeds", () => {
    const updates = buildNotificacionUsuarioUpdates([basePending], true, now);

    expect(updates).toEqual([
      {
        usuario_notificacion_id: 10,
        estado: "enviado",
        fecha_envio: "2026-05-28T10:00:00.000Z",
        cantidad_intentos: 1,
        error_envio: null,
      },
    ]);
  });

  test("marks every pending user notification as failed and increments attempts when push fails", () => {
    const updates = buildNotificacionUsuarioUpdates(
      [basePending],
      false,
      now,
      "No hay tokens validos"
    );

    expect(updates).toEqual([
      {
        usuario_notificacion_id: 10,
        estado: "fallido",
        fecha_envio: null,
        cantidad_intentos: 2,
        error_envio: "No hay tokens validos",
      },
    ]);
  });
});
