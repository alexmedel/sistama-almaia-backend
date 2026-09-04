// services/NotificationPushService.ts
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface NotificationData {
  [key: string]: any;
}

interface SendResult {
  success: boolean;
  tickets?: ExpoPushTicket[];
  errors?: string[];
  error?: string;
}

export default class NotificationPushService {
  private expo: Expo;
  private supabase: SupabaseClient;

  constructor() {
    this.expo = new Expo();
    this.supabase = createClient(
      process.env.SUPABASE_HOST!,
      process.env.SUPABASE_PASSWORD_ADMIN!
    );
  }

  // Guardar token en la base de datos
  async saveToken(userId: number, pushToken: string) {
    const { data, error } = await this.supabase
      .from("usuarios")
      .update({
        expo_push_token: pushToken,
      })
      .eq("usuario_id", userId)
      .select();

    if (error) {
      throw new Error(`Error guardando token: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    return data[0];
  }

  // Obtener token de un usuario
  async getTokenByUserId(userId: number): Promise<string | null> {
    console.log("✅ Obteniendo token de usuario:", userId);
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("expo_push_token")
      .eq("usuario_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.expo_push_token;
  }

  // Obtener tokens de múltiples usuarios
  async getTokensByUserIds(userIds: number[]): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("expo_push_token")
      .in("usuario_id", userIds)
      .not("expo_push_token", "is", null);

    if (error || !data) {
      return [];
    }

    return data.map((user: any) => user.expo_push_token);
  }

  // Obtener todos los tokens
  async getAllTokens(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("expo_push_token")
      .not("expo_push_token", "is", null);

    if (error || !data) {
      return [];
    }

    return data.map((user: any) => user.expo_push_token);
  }

  // Enviar notificaciones
  async sendNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<SendResult> {
    const messages: ExpoPushMessage[] = [];

    for (const pushToken of pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Token inválido: ${pushToken}`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: "default",
        title: title,
        body: body,
        data: data,
        priority: "high",
        channelId: "default",
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        error: "No hay tokens válidos",
      };
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    const errors: string[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log(`✅ Chunk enviado: ${ticketChunk.length} notificaciones`);
      } catch (error: any) {
        console.error("❌ Error enviando chunk:", error);
        errors.push(error.message);
      }
    }

    return {
      success: tickets.length > 0,
      tickets,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async sendToMultipleUsers(
    userIds: number[],
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<SendResult> {
    try {
      const tokens = await this.getTokensByUserIds(userIds);

      if (tokens.length === 0) {
        return {
          success: false,
          error: "No se encontraron tokens para los usuarios especificados",
        };
      }

      console.log(
        `📤 Enviando a ${tokens.length} de ${userIds.length} usuarios solicitados`
      );

      return await this.sendNotifications(tokens, title, body, data);
    } catch (error: any) {
      console.error("Error en sendToMultipleUsers:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async obtenerNotificacionesPendientes(id: number, destinatario_tipo: string) {
    console.log("✅ Notificaciones obtenidas:", id, destinatario_tipo);
    const { data, error } = await this.supabase
      .from("aviso_destinatarios")
      .select("*,avisos_apps(*)")
      .eq("destinatario_tipo", destinatario_tipo)
      .eq("destinatario_id", id);

    if (error) {
      throw new Error(
        `Error obteniendo notificaciones pendientes: ${error.message}`
      );
    }

    return data;
  }

  async marcarNotificacion(aviso_destinario_id: number) {
    const { data, error } = await this.supabase
      .from("aviso_destinatarios")
      .update({
        fecha_leido: new Date().toISOString(),
      })
      .eq("aviso_destinatarios_id", aviso_destinario_id)
      .select();

    if (error) {
      throw new Error(`Error marcando notificacion: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Notificacion no encontrada");
    }

    return data[0];
  }

  async marcarEntregable(aviso_destinario_id: number) {
    const { data, error } = await this.supabase
      .from("aviso_destinatarios")
      .update({
        fecha_recibido: new Date().toISOString(),
      })
      .eq("aviso_destinatarios_id", aviso_destinario_id)
      .select();

    if (error) {
      throw new Error(`Error marcando notificacion: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Notificacion no encontrada");
    }

    return data[0];
  }
}
