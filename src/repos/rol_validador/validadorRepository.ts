import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../core/services/supabaseAdmin";

const APODERADO_SELECT =
  "apoderado_id,persona_id,colegio_id,email_contacto1,email_contacto2,activo,perfil_completado,is_blocked";
const DOCENTE_SELECT =
  "docente_id,persona_id,colegio_id,especialidad,estado,activo";
const ALUMNO_SELECT =
  "alumno_id,persona_id,colegio_id,email,url_foto_perfil,activo,perfil_completado,is_blocked";

export default class ValidadorRepository {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = new SupabaseAdminService().getClient();
  }

  async apoderado(id: number) {
    const { data, error } = await this.supabase
      .from("apoderados")
      .select(APODERADO_SELECT)
      .eq("persona_id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async docente(id: number) {
    const { data, error } = await this.supabase
      .from("docentes")
      .select(DOCENTE_SELECT)
      .eq("persona_id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async alumno(id: number) {
    const { data, error } = await this.supabase
      .from("alumnos")
      .select(ALUMNO_SELECT)
      .eq("persona_id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
