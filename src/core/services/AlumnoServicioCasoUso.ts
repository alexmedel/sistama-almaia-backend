 
import SupabaseClient from "@supabase/supabase-js/dist/module/SupabaseClient";
import { SupabaseClientService } from "./supabaseClient";
import { formatISO, startOfDay } from "date-fns";

export class AlumnoServicioCasoUso {
  private supabaseService?: SupabaseClientService;
  private client: SupabaseClient;
  private id_colegio = 0;
  constructor(id_colegio: number, client?: SupabaseClient) {
    this.supabaseService = client ? undefined : new SupabaseClientService();
    this.client = client ?? this.supabaseService!.getClient();
    this.id_colegio = id_colegio;
  }
  async obtenerAlumnosColegio() {
    const query = this.client
      .from("alumnos")
      .select("*")
      .eq("colegio_id", this.id_colegio);
    const { data, error } = await query;
    if (error) {
      throw new Error(
        `Error obteniendo  alumnos por colegio: ${error.message}`
      );
    }
    return data;
  }
  async obtenerCantidadAlumnos(colegioId: number) {
    const { count, error } = await this.client
      .from("alumnos")
      .select("*", { count: "exact", head: true })
      .eq("colegio_id", colegioId);
    if (error) {
      throw new Error(`Error obteniendo count de alumnos: ${error.message}`);
    }

    return count ?? 0;
  }
  async obntenerConteoporTabla(
    table: string,
    dateFilter: string,
    alumnos: any
  ) {
    const arrayAlumnoIds: number[] = alumnos.map(
      (alumno: { alumno_id: number }) => alumno.alumno_id
    );
    const { count, error } = await this.client
      .from(table)
      .select("*", { count: "exact", head: true })
      .in("alumno_id", arrayAlumnoIds)
      .gte("fecha_creacion", dateFilter);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async obtenerAlumnosActivos(colegio_id: number) {

    const { data, error } = await this.client.rpc('alumnos_activos', {
      p_colegio_id: colegio_id,
    });

    // const { data, error } = await this.client.from('alumnos').select('*').eq('activo', true).eq('colegio_id', colegio_id)
    if (error) {
      throw new Error(`Error al obtener estadísticas de alertas: ${error.message}`);
    }
    return data
  }

  async calcularAlumnosActivos(sevenDaysAgo: string) {
    const [respuestasTexto, respuestasSeleccion] = await Promise.all([
      this.client
        .from("alumnos_respuestas")
        .select("alumno_id, fecha_creacion")
        .gte("fecha_creacion", sevenDaysAgo),
      this.client
        .from("alumno_respuesta_seleccion")
        .select("alumno_id, fecha_creacion")
        .gte("fecha_creacion", sevenDaysAgo),
    ]);

    return [
      ...(respuestasTexto.data ?? []),
      ...(respuestasSeleccion.data ?? []),
    ];
  }

  calcularAlumnosFrecuentes(responses: any[]) {
    const actividadPorAlumno: Record<number, Set<string>> = {};

    responses.forEach((resp) => {
      const alumnoId = resp.alumno_id;
      const fecha = formatISO(startOfDay(new Date(resp.fecha_creacion)), {
        representation: "date",
      });

      if (!actividadPorAlumno[alumnoId]) {
        actividadPorAlumno[alumnoId] = new Set();
      }

      actividadPorAlumno[alumnoId].add(fecha);
    });

    return Object.values(actividadPorAlumno).filter((dias) => dias.size >= 3)
      .length;
  }

  buildStatsResponse(
    totalAlumnos: number,
    alumnosActivos: number,
    alumnosFrecuentes: number,
    alumnosSeleccion: number
  ) {
    return {
      alumnos: {
        activos: alumnosActivos,
        inactivos: alumnosActivos - totalAlumnos,
        frecuentes: alumnosFrecuentes,
        totales: totalAlumnos + alumnosSeleccion,
      },
      sos_alma: {
        activos: 5,
        vencidos: 0,
        por_vencer: 2,
        totales: 13,
      },
      denuncias: {
        activos: 19,
        vencidos: 0,
        por_vencer: 3,
        totales: 24,
      },
      alertas_alma: {
        activos: 57,
        vencidos: 0,
        por_vencer: 6,
        totales: 82,
      },
    };
  }
}
export async function contarAlumnosPorColegio(client: SupabaseClient, colegio_id: number): Promise<number>  {
  const { data, error } = await client
    .from("alumnos")
    .select("*"  )
    .eq("colegio_id", colegio_id)
    .eq('activo' , true);

  if (error) {
    console.error(`Error al contar alumnos del colegio ${colegio_id}:`, error.message);
    return 0;
  }
  
  return data?.length ?? 0;
}
export async function buscarAlumnos(
  client: SupabaseClient,
  termino: string,
  colegioId?: any | null,
  cursos?: number[]
) {

  const { data, error } = await client
    .rpc("buscar_alumnos", {
      termino,
      colegio_id_param: colegioId,
      cursos_ids_param: cursos,
    });

  if (error) {
    console.error("Error buscando alumnos:", error);
    return [];
  }

  return data;
}
