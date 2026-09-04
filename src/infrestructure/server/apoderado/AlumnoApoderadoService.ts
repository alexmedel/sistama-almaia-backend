import { DataService } from "../DataService";
import { AlumnoApoderado } from "../../../core/modelo/apoderado/AlumnoApoderado";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoApoderadoSchema } from "./shemas/AlumnoApoderadoSchema";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<AlumnoApoderado> = new DataService(
  "alumnos_apoderados",
  "alumno_apoderado_id"
);

export const AlumnoApoderadoService = {
  async obtenerRelaciones(queryParams: any) {
    const { colegio_id, ...where } = queryParams;

    if (colegio_id) {
      return await obtenerRelacionados({
        tableFilter: "apoderados",
        filterField: "colegio_id",
        filterValue: colegio_id,
        idField: "apoderado_id",
        tableIn: "alumnos_apoderados",
        inField: "apoderado_id",
        selectFields: `*,
            alumnos(alumno_id,
            url_foto_perfil,
            consentimiento,
            personas(persona_id,nombres,apellidos)),
            apoderados (
            apoderado_id,
            persona_id,
            personas (
            persona_id,
            tipo_documento,
            numero_documento,
            nombres,
            apellidos,
            genero_id,
            estado_civil_id
            )
          )`,
      });
    }

    return await dataService.getAll(
      [
        "*",
        "apoderados(apoderado_id,persona_id,personas(persona_id,tipo_documento,numero_documento,nombres,apellidos,genero_id,estado_civil_id, usuarios(usuario_id)))",
        "alumnos(alumno_id,url_foto_perfil,consentimiento,personas(persona_id,nombres,apellidos, usuarios(usuario_id)))",
      ],
      where
    );
  },

  async guardarRelacion(
    relacionData: any,
    creado_por: number,
    actualizado_por: number
  ) {
    const { error: validationError } =
      AlumnoApoderadoSchema.validate(relacionData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    const { data: alumnoData, error: alumnoError } = await client
      .from("alumnos")
      .select("*")
      .eq("alumno_id", relacionData.alumno_id)
      .single();
    if (alumnoError || !alumnoData) {
      throw new Error("El alumno no existe");
    }

    const { data: apoderadoData, error: apoderadoError } = await client
      .from("apoderados")
      .select("*")
      .eq("apoderado_id", relacionData.apoderado_id)
      .single();
    if (apoderadoError || !apoderadoData) {
      throw new Error("El apoderado no existe");
    }

    const alumnoApoderado: AlumnoApoderado = new AlumnoApoderado();
    Object.assign(alumnoApoderado, relacionData);
    alumnoApoderado.creado_por = creado_por;
    alumnoApoderado.actualizado_por = actualizado_por;

    return await dataService.processData(alumnoApoderado);
  },

  async actualizarRelacion(
    id: number,
    relacionData: any,
    actualizado_por: number
  ) {
    const { error: validationError } =
      AlumnoApoderadoSchema.validate(relacionData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    
    // Verificaciones de existencia
    const { data: alumnoData, error: alumnoError } = await client
      .from("alumnos")
      .select("*")
      .eq("alumno_id", relacionData.alumno_id)
      .single();
    if (alumnoError || !alumnoData) {
      throw new Error("El alumno no existe");
    }
    const { data: apoderadoData, error: apoderadoError } = await client
      .from("apoderados")
      .select("*")
      .eq("apoderado_id", relacionData.apoderado_id)
      .single();
    if (apoderadoError || !apoderadoData) {
      throw new Error("El apoderado no existe");
    }

    const alumnoApoderado: AlumnoApoderado = new AlumnoApoderado();
    Object.assign(alumnoApoderado, relacionData);
    alumnoApoderado.actualizado_por = actualizado_por;

    await dataService.updateById(id, alumnoApoderado);
    return { message: "AlumnoApoderado actualizado correctamente" };
  },

  async eliminarRelacion(id: number) {
    await dataService.deleteById(id);
    return { message: "AlumnoApoderado eliminada correctamente" };
  },
};