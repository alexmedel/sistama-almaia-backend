import { SupabaseClientService } from "../supabaseClient";
import { ComprarBeneficio } from "./types";
const supabaseService = new SupabaseClientService();
const client = supabaseService.getClient();

export class BeneficiosService {
  async getBeneficios( ) {
    try {
      const { data: beneficios, error } = await client
        .from("beneficios")
        .select("*, beneficios_descripcion(*)");

      if (error) {
        throw new Error(error.message);
      }
      return beneficios;
    } catch (err) {
      console.error("Error al obtener beneficios:", err);
      throw err;
    }
  }

  async getBeneficiosPorId(beneficio_id: number) {
    try {
      const { data: beneficios, error } = await client
        .from("beneficios")
        .select("* , beneficios_descripcion(*)")
        .eq("beneficio_id", beneficio_id);

      if (error) {
        throw new Error(error.message);
      }
      return beneficios;
    } catch (error) {
      console.error("Error al obtener beneficios:", error);
      throw error;
    }
  }

  async clickBeneficio(body: ComprarBeneficio) {
    try {
      const { data: click, error } = await client
        .from("beneficios_click")
        .insert(body)
        .select("*");
      if (error) {
        throw new Error(error.message);
      }
      return click;
    } catch (err) {
      console.error("Error al obtener beneficios:", err);
      throw err;
    }
  }

  async confirmarExistencia(id: number) {
    try {
      const { data: beneficiario, error } = await client
        .from("beneficios_descripcion")
        .select("stock")
        .eq("beneficio_id", id);

      if (error) {
        throw new Error(error.message);
      }
      return beneficiario;
    } catch (err) {
      console.error("Error al obtener beneficiario:", err);
      throw err;
    }
  }
}
