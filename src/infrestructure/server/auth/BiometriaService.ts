import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

function getAuthenticatedUserId(req: Request): number | undefined {
  return (req as any).user?.usuario_id;
}

export class BiometriaService {
  static async activar(req: Request, res: Response) {
    try {
      const user_id = getAuthenticatedUserId(req);
      if (!user_id) {
        FormatResponse(res, 401, { message: "No autorizado" });
        return;
      }

      const { error } = await client
        .from("usuarios")
        .update({ biometria_activa: true })
        .eq("usuario_id", user_id);

      if (error) {
        res
          .status(500)
          .json({ message: "Error al activar", error: error.message });
        return;
      }

      FormatResponse(res, 200, { message: "Biometría activada" });
    } catch (err: any) {
      errorHandler.handleError(err, res, "BiometriaService.activar");
    }
  }

  static async desactivar(req: Request, res: Response) {
    try {
      const user_id = getAuthenticatedUserId(req);
      if (!user_id) {
        FormatResponse(res, 401, { message: "No autorizado" });
        return;
      }

      const { error } = await client
        .from("usuarios")
        .update({ biometria_activa: false })
        .eq("usuario_id", user_id);

      if (error) {
        res
          .status(500)
          .json({ message: "Error al desactivar", error: error.message });
        return;
      }
      FormatResponse(res, 200, { message: "Biometría desactivada" });
    } catch (err) {
      errorHandler.handleError(err, res, "BiometriaService.desactivar");
    }
  }

  static async estado(req: Request, res: Response) {
    try {
      const user_id = getAuthenticatedUserId(req);
      if (!user_id) {
        FormatResponse(res, 401, { message: "No autorizado" });
        return;
      }

      const { data, error } = await client
        .from("usuarios")
        .select("biometria_activa")
        .eq("usuario_id", user_id)
        .single();

      if (error) {
        res
          .status(500)
          .json({ message: "Error al obtener estado", error: error.message });
        return;
      }
      FormatResponse(res, 200, {
        biometria_activa: Boolean(data?.biometria_activa),
      });
    } catch (err: any) {
      errorHandler.handleError(err, res, "BiometriaService.estado");
    }
  }

  static async loginWithBiometric(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        throw new Error("Se requiere refresh_token");
      }
      const { data, error } = await client.auth.refreshSession({
        refresh_token,
      });

      if (error || !data.session) {
        throw new Error(error?.message || "No se pudo refrescar sesión");
      }
      const user = data.session.user;
      if (!user || !user.email) {
        throw new Error("Usuario no encontrado en la sesión");
      }
      const { data: userData, error: userError } = await client
        .from("usuarios")
        .select("biometria_activa")
        .eq("email", user.email)
        .single();

      if (userError || !userData) {
        throw new Error("Error al verificar el estado de biometría");
      }

      if (!userData.biometria_activa) {
        throw new Error("La biometría no está activada para este usuario");
      }

      // Si la biometría está activada, devolver los tokens
      FormatResponse(res, 200, {
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } catch (err: unknown) {
      errorHandler.handleError(err, res, "BiometriaService.loginWithBiometric");
    }
  }
}
