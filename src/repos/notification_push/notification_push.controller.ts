// controllers/NotificationPushController.ts
import { Request, Response } from "express";
import NotificationPushService from "./notification_push.service";

export default class NotificationPushController {
  private notificationService: NotificationPushService;

  constructor() {
    this.notificationService = new NotificationPushService();
  }

  // Guardar token de dispositivo
  saveToken = async (req: Request, res: Response) => {
    try {
      const { userId, pushToken } = req.body;

      if (!userId || !pushToken) {
        res.status(400).json({
          error: "userId y pushToken son requeridos",
        });
      }

      const data = await this.notificationService.saveToken(userId, pushToken);

      console.log("✅ Token guardado para usuario:", userId);
      res.json({
        success: true,
        message: "Token guardado correctamente",
        data,
      });
    } catch (error: any) {
      console.error("Error en saveToken:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  };

  // Enviar notificación a un usuario
  saveAuthenticatedToken = async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user?.usuario_id;
      const { pushToken } = req.body;

      if (!usuarioId || isNaN(usuarioId)) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      if (!pushToken || typeof pushToken !== "string") {
        res.status(400).json({ error: "pushToken es requerido" });
        return;
      }

      const data = await this.notificationService.saveToken(
        usuarioId,
        pushToken
      );

      res.json({
        success: true,
        message: "Token push guardado correctamente",
        data,
      });
    } catch (error: any) {
      console.error("Error en saveAuthenticatedToken:", error.message);
      res.status(500).json({ error: error.message });
    }
  };

  sendToUser = async (req: Request, res: Response) => {
    try {
      const { userId, title, body, data } = req.body;

      if (!userId || !title || !body) {
        res.status(400).json({
          error: "userId, title y body son requeridos",
        });
      }

      const token = await this.notificationService.getTokenByUserId(userId);

      if (!token) {
        res.status(404).json({
          error: "Token no encontrado para este usuario",
        });
        return;
      }

      const result = await this.notificationService.sendNotifications(
        [token],
        title,
        body,
        data || {}
      );

      if (!result.success) {
        res.status(500).json({
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: "Notificación enviada",
        tickets: result.tickets,
      });
    } catch (error: any) {
      console.error("Error en sendToUser:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  };

  // Enviar notificación a múltiples usuarios
  sendToMultiple = async (req: Request, res: Response) => {
    try {
      const { userIds, title, body, data } = req.body;

      if (!userIds || !Array.isArray(userIds) || !title || !body) {
        res.status(400).json({
          error: "userIds (array), title y body son requeridos",
        });
      }

      const tokens = await this.notificationService.getTokensByUserIds(userIds);

      if (tokens.length === 0) {
        res.status(404).json({
          error: "No se encontraron tokens para los usuarios",
        });
        return;
      }

      console.log(`📤 Enviando a ${tokens.length} usuarios`);

      const result = await this.notificationService.sendNotifications(
        tokens,
        title,
        body,
        data || {}
      );

      if (!result.success) {
        res.status(500).json({
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: `Notificación enviada a ${tokens.length} usuarios`,
        tickets: result.tickets,
      });
    } catch (error: any) {
      console.error("Error en sendToMultiple:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  };

  // Enviar notificación a todos los usuarios
  sendToAll = async (req: Request, res: Response) => {
    try {
      const { title, body, data } = req.body;

      if (!title || !body) {
        res.status(400).json({
          error: "title y body son requeridos",
        });
      }

      const tokens = await this.notificationService.getAllTokens();

      if (tokens.length === 0) {
        res.status(404).json({
          error: "No hay usuarios con tokens registrados",
        });
      }

      console.log(`📢 Broadcast a ${tokens.length} usuarios`);

      const result = await this.notificationService.sendNotifications(
        tokens,
        title,
        body,
        data || {}
      );

      if (!result.success) {
        res.status(500).json({
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: `Broadcast enviado a ${tokens.length} usuarios`,
        tickets: result.tickets,
      });
    } catch (error: any) {
      console.error("Error en sendToAll:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  };

  async obtenerNotificacionesPendientes(req: Request, res: Response) {
    console.log("✅ Notificaciones obtenidas:", req.query);
    try {
      const { destinatario_id, tipo } = req.query;
      const notificaciones =
        await this.notificationService.obtenerNotificacionesPendientes(
          Number(destinatario_id),
          String(tipo)
        );

      console.log("✅ Notificaciones obtenidas:", notificaciones);
      res.json({
        success: true,
        message: "Notificaciones obtenidas exitosamente",
        data: notificaciones,
      });
    } catch (error: any) {
      console.error("Error en obtenerNotificacionesPendientes:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  }

  async marcarNotificacion(req: Request, res: Response) {
    console.log("✅ Notificaciones obtenidas:", req.body);
    try {
      const { aviso_destinario_id } = req.body;

      const notificacion = await this.notificationService.marcarNotificacion(
        aviso_destinario_id
      );

      console.log("✅ Notificacion marcada:", notificacion);
      res.json({
        success: true,
        message: "Notificacion marcada exitosamente",
        data: notificacion,
      });
    } catch (error: any) {
      console.error("Error en marcarNotificacion:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  }

  async marcarEntregable(req: Request, res: Response) {
    try {
      const { aviso_destinario_id } = req.body;

      const notificacion = await this.notificationService.marcarEntregable(
        aviso_destinario_id
      );

      console.log("✅ Notificacion marcada:", notificacion);
      res.json({
        success: true,
        message: "Notificacion marcada exitosamente",
        data: notificacion,
      });
    } catch (error: any) {
      console.error("Error en marcarEntregable:", error.message);
      res.status(500).json({
        error: error.message,
      });
    }
  }
}
