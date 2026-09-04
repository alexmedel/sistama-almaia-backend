 
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "./supabaseAdmin";
import { contarAlertasPorColegio } from "./AlertasServiceCasoUso";
import { contarAlumnosPorColegio } from "./AlumnoServicioCasoUso";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
export async function obtenerIdColegio(
  colegio_id: any,
  usuario_id: number,
  supabase: SupabaseClient = client
) {
  if (colegio_id === undefined || colegio_id === null || colegio_id === "") {
    const { data: usuario_colegio, error } = await supabase
      .from("usuarios_colegios")
      .select("colegio_id")
      .eq("usuario_id", usuario_id)
      .eq("activo", true); // Permite que no haya ningún resultado
    if (usuario_colegio?.length === 0) {
      throw new Error("El usuario no posee colegio designado");
    }

    if (error) {
      throw new Error(error.message);
    }

    if (usuario_colegio) {
      colegio_id = usuario_colegio[0]?.colegio_id;
    }
  }
  return colegio_id;
}
type ColegioExtendido = {
  colegio_id: number;
  nombre: string;
  nombre_fantasia: string;
  tipo_colegio: string;
  dependencia: string;
  sitio_web: string;
  direccion: string;
  telefono_contacto: string;
  correo_electronico: string;
  creado_por: number;
  actualizado_por: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  comuna_id: number;
  region_id: number;
  pais_id: number;
  alerts: number;
  students: number;
};

export async function mapearColegios(
  arrayOriginal: any,
  supabase: SupabaseClient = client
): Promise<ColegioExtendido[]> {
  const resultados = await Promise.all(arrayOriginal.filter((e: any) => e.colegios).map(async (item: { colegio_id: number; colegios: { nombre: any; nombre_fantasia: any; tipo_colegio: any; dependencia: any; sitio_web: any; direccion: any; telefono_contacto: any; correo_electronico: any; comuna_id: any; region_id: any; pais_id: any; }; creado_por: any; actualizado_por: any; fecha_creacion: any; fecha_actualizacion: any; activo: any; }) => {
    if (item.colegios) {

      return {
        colegio_id: item.colegio_id,
        nombre: item.colegios.nombre,
        nombre_fantasia: item.colegios.nombre_fantasia || "",
        tipo_colegio: item.colegios.tipo_colegio || "",
        dependencia: item.colegios.dependencia || "",
        sitio_web: item.colegios.sitio_web || "",
        direccion: item.colegios.direccion || "",
        telefono_contacto: item.colegios.telefono_contacto || "",
        correo_electronico: item.colegios.correo_electronico || "",
        creado_por: item.creado_por,
        actualizado_por: item.actualizado_por,
        fecha_creacion: item.fecha_creacion,
        fecha_actualizacion: item.fecha_actualizacion,
        activo: item.activo,
        comuna_id: item.colegios.comuna_id || 0,
        region_id: item.colegios.region_id || 0,
        pais_id: item.colegios.pais_id || 0,
        alerts: await contarAlertasPorColegio(supabase, item.colegio_id),
        students: await contarAlumnosPorColegio(supabase, item.colegio_id)
      };
    }
  }));

  return resultados;
}

