import { SupabaseClientService } from "../supabaseClient";

const supabaseService = new SupabaseClientService();
const client = supabaseService.getClient();
type EstadoAsistencia = "SI" | "MIXTO" | "NO";

export class ConfiguracionAsistidaApoderadoAlumnoService {
  constructor() {}

  async configuracionAsistidaApoderadoAlumno(body: {
    alumno_id: number;
    apoderado_id: number;
    asistido: EstadoAsistencia;
  }) {
    try {
      // 1. Verificar la asociación
      const apoderadoAlumnoExiste = await this.checkApoderado(
        body.alumno_id,
        body.apoderado_id
      );

      if (!apoderadoAlumnoExiste) {
        return {
          message: "El alumno y el apoderado no están asociados",
        };
      }

      // 2. Realizar la actualización con el nuevo campo ENUM
      const { data, error } = await client
        .from("alumnos")
        .update({ asistido: body.asistido })
        .eq("alumno_id", body.alumno_id)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error("Error al configurar asistencia:", err);
      throw err;
    }
  }

  async checkApoderado(
    alumno_id: number,
    apoderado_id: number
  ): Promise<boolean> {
    try {
      const { data: apoderado, error } = await client
        .from("alumnos_apoderados")
        .select("alumno_apoderado_id")
        .eq("alumno_id", alumno_id)
        .eq("apoderado_id", apoderado_id)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return !!apoderado;
    } catch (err) {
      console.error("Error al obtener apoderado:", err);
      throw err;
    }
  }
}
