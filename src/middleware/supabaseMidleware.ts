 
import { Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
const { SUPABASE_HOST, SUPABASE_PASSWORD, SUPABASE_PASSWORD_ADMIN } = process.env;
const MFA_EXEMPT_ROLE_IDS = new Set([2, 4]);
const MFA_ALLOWED_PATHS = new Set([
  "/mfa/status",
  "/mfa/enroll",
  "/mfa/challenge",
  "/mfa/verify",
]);

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export const sessionAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader || (req.headers["x-almaia-access"] as string | undefined);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }
    if (!SUPABASE_HOST || !SUPABASE_PASSWORD || !SUPABASE_PASSWORD_ADMIN) {
      throw new Error("Faltan variables de entorno de Supabase");
    }
    // 🔐 Crea cliente con token embebido
    // const client: SupabaseClient = createClient(
    //   SUPABASE_HOST,
    //   SUPABASE_PASSWORD,
    //   {
    //     global: {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     },
    //   }
    // );

    const admin: SupabaseClient = createClient(
      SUPABASE_HOST,
      SUPABASE_PASSWORD_ADMIN
    );

    const tokenClient: SupabaseClient = createClient(
      SUPABASE_HOST,
      SUPABASE_PASSWORD,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data, error } = await tokenClient.auth.getUser();
    if (error || !data?.user) {
      throw new UnauthorizedError(error?.message || "Invalid token");
    }

    const { data: data_user, error: error_user } = await admin
      .from("usuarios")
      .select()
      .eq("auth_id", data.user?.id);

    if (error_user || !data_user?.[0]) {
      throw new UnauthorizedError(error_user?.message || "Usuario no encontrado");
    }

    const isHighPrivilegeRole =
      data_user?.[0]?.rol_id && !MFA_EXEMPT_ROLE_IDS.has(data_user?.[0]?.rol_id);

    if (isHighPrivilegeRole && !MFA_ALLOWED_PATHS.has(req.path)) {
      const [{ data: aalData, error: aalError }, { data: factorData, error: factorError }] =
        await Promise.all([
          tokenClient.auth.mfa.getAuthenticatorAssuranceLevel(),
          admin.auth.admin.mfa.listFactors({ userId: data.user.id }),
        ]);

      if (aalError) {
        throw new Error(aalError.message);
      }

      if (factorError) {
        throw new Error(factorError.message);
      }

      const verifiedFactors = (factorData?.factors || []).filter(
        (factor: any) => factor.status === "verified"
      );

      if (verifiedFactors.length > 0 && aalData?.currentLevel !== "aal2") {
        res.status(403).json({
          error: "MFA requerido",
          code: "MFA_REQUIRED",
        });
        return;
      }
    }

    req.creado_por = data_user?.[0]?.usuario_id;
    req.actualizado_por = data_user?.[0]?.usuario_id;
    req.fecha_creacion = new Date().toUTCString();
    req.user = data_user?.[0];
    req.supabase = tokenClient;
    req.supabaseAdmin = admin;

    next();
    
  } catch (error: any) {
    console.error("[sessionAuth]", error?.message || error);

    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};
