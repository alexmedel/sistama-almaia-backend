import { SupabaseClient } from "@supabase/supabase-js";
import NotificationPushService from "../../../../repos/notification_push/notification_push.service";
import { obtenerNotificacionesPendientes } from "../funciones/funcionesAviso";
import { agruparPorAviso } from "../interfaces/avisos_pendientes";

export type UsuarioNotificacionEstado =
  | "pendiente"
  | "enviado"
  | "recibido"
  | "leido"
  | "fallido"
  | "sin_token";

export type UsuarioNotificacionPendiente = {
  usuario_notificacion_id: number;
  aviso_id: number;
  usuario_id: number;
  expo_push_token: string;
  aviso_titulo: string;
  aviso_contenido: string;
  cantidad_intentos: number;
};

export type UsuarioNotificacionUpdate = {
  usuario_notificacion_id: number;
  estado: UsuarioNotificacionEstado;
  fecha_envio: string | null;
  cantidad_intentos: number;
  error_envio: string | null;
};

export interface EnvioResumen {
  totalPendientes: number;
  lotesProcesados: number;
  enviadosOK: number;
  lotesFallidos: number;
  detalles: Array<{
    aviso_id: number;
    tokens: number;
    success: boolean;
    error?: string;
  }>;
}

export function buildNotificacionUsuarioUpdates(
  items: UsuarioNotificacionPendiente[],
  success: boolean,
  now = new Date(),
  error?: string
): UsuarioNotificacionUpdate[] {
  return items.map((item) => ({
    usuario_notificacion_id: item.usuario_notificacion_id,
    estado: success ? "enviado" : "fallido",
    fecha_envio: success ? now.toISOString() : null,
    cantidad_intentos: success
      ? item.cantidad_intentos
      : item.cantidad_intentos + 1,
    error_envio: success ? null : error || "Error enviando notificacion push",
  }));
}

function agruparUsuariosPorAviso(items: UsuarioNotificacionPendiente[]) {
  const map = new Map<number, UsuarioNotificacionPendiente[]>();

  for (const item of items) {
    if (!map.has(item.aviso_id)) {
      map.set(item.aviso_id, []);
    }
    map.get(item.aviso_id)!.push(item);
  }

  return map;
}

async function obtenerUsuariosNotificacionesPendientes(
  client: SupabaseClient
): Promise<UsuarioNotificacionPendiente[]> {
  const { data, error } = await client.rpc(
    "obtener_usuarios_notificaciones_pendientes"
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function aplicarUsuariosNotificacionesUpdates(
  client: SupabaseClient,
  updates: UsuarioNotificacionUpdate[]
) {
  for (const update of updates) {
    const { error } = await client
      .from("usuarios_notificaciones")
      .update({
        estado: update.estado,
        fecha_envio: update.fecha_envio,
        cantidad_intentos: update.cantidad_intentos,
        error_envio: update.error_envio,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("usuario_notificacion_id", update.usuario_notificacion_id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function enviarNotificacionesPendientes(
  client: SupabaseClient
) {
  const pushService = new NotificationPushService();
  const usuariosPendientes = await obtenerUsuariosNotificacionesPendientes(
    client
  );

  if (usuariosPendientes.length > 0) {
    const agrupados = agruparUsuariosPorAviso(usuariosPendientes);

    for (const [avisoId, items] of agrupados) {
      const tokens = items.map((i) => i.expo_push_token);
      const result = await pushService.sendNotifications(
        tokens,
        items[0].aviso_titulo,
        items[0].aviso_contenido,
        { aviso_id: avisoId }
      );
      const updates = buildNotificacionUsuarioUpdates(
        items,
        result.success,
        new Date(),
        result.error || result.errors?.join("; ")
      );

      await aplicarUsuariosNotificacionesUpdates(client, updates);

      // Marca también la tabla antigua para no duplicar envíos en el bloque de respaldo
      if (result.success || result.error === "No hay tokens válidos") {
        await client
          .from("aviso_destinatarios")
          .update({ fecha_envio: new Date().toISOString() })
          .eq("aviso_id", avisoId)
          .is("fecha_envio", null);
      }
    }
  }

  const pendientes = await obtenerNotificacionesPendientes(client);
  const agrupados = agruparPorAviso(pendientes);

  for (const [avisoId, items] of agrupados) {
    const tokens = items.map(i => i.expo_push_token);

    const result = await pushService.sendNotifications(
      tokens,
      items[0].aviso_titulo,
      items[0].aviso_contenido,
      { aviso_id: avisoId }
    );

    // Actualizamos fecha_envio siempre para que no se quede pegado en "Pendiente",
    // a menos que haya sido un error grave de red. Si no hay tokens, igual lo marcamos como enviado
    // para que la interfaz lo muestre completado y no intente re-enviar infinitamente.
    if (result.success || result.error === "No hay tokens válidos") {
      const ids = items.map(i => i.aviso_destinatarios_id);

      await client
        .from("aviso_destinatarios")
        .update({ fecha_envio: new Date().toISOString() })
        .in("aviso_destinatarios_id", ids);
    }
  }
}
