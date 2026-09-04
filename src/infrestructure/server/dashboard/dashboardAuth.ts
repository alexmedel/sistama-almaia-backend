import { SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";
import { obtenerIdColegio } from "../../../core/services/ColegioServiceCasoUso";

export async function resolverColegioDashboard(
  req: Request,
  supabase: SupabaseClient
): Promise<number> {
  const colegioId = Number(
    await obtenerIdColegio(
      req.query.colegio_id,
      req.user?.usuario_id,
      supabase
    )
  );

  if (!Number.isFinite(colegioId)) {
    throw new Error("colegio_id debe ser un número");
  }

  const userRole = req.user?.rol_id;
  const isGlobalAdmin = userRole === 10 || userRole === 11 || userRole === 12 || userRole === 13;

  if (!isGlobalAdmin) {
    const { data, error } = await supabase
      .from("usuarios_colegios")
      .select("colegio_id")
      .eq("usuario_id", req.user?.usuario_id)
      .eq("colegio_id", colegioId)
      .eq("activo", true)
      .limit(1);

    if (error) {
      throw new Error(`Error validando colegio del usuario: ${error.message}`);
    }

    if (!data?.length) {
      throw new Error("No autorizado para consultar este colegio");
    }
  }

  return colegioId;
}

export function obtenerClienteRequest(req: Request, fallback: SupabaseClient) {
  return req.supabase ?? fallback;
}
