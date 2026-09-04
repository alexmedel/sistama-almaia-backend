import { DataService } from "../DataService";
import { Apoderado } from "../../../core/modelo/apoderado/Apoderado";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import { mapearDatosAlumno } from "../../../core/services/PerfilServiceCasoUso";
import { ApoderadoSchema } from "./shemas/ApoderadoSchema";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<Apoderado> = new DataService(
  "apoderados",
  "apoderado_id"
);

export const ApoderadoService = {
  async obtenerApoderados(where: any) {
    console.log("ajaaas");
    const apoderados = await dataService.getAll(
      [
        "*",
        "personas(persona_id,nombres,apellidos)",
        "colegios(colegio_id,nombre)",
        "profesiones_oficios(profesion_oficio_id,nombre,tipos_oficios(tipo_oficio_id,nombre))",
      ],
      where
    );
    return apoderados;
  },

  async guardarApoderado(
    apoderadoData: any,
    creado_por: number,
    actualizado_por: number
  ) {
    const { error: validationError } = ApoderadoSchema.validate(apoderadoData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const { data: personaData, error: personaError } = await client
      .from("personas")
      .select("*")
      .eq("persona_id", apoderadoData.persona_id)
      .single();
    if (personaError || !personaData) {
      throw new Error("La persona no existe");
    }
    const { data: colegioData, error: colegioError } = await client
      .from("colegios")
      .select("*")
      .eq("colegio_id", apoderadoData.colegio_id)
      .single();
    if (colegioError || !colegioData) {
      throw new Error("El colegio no existe");
    }

    const apoderado: Apoderado = new Apoderado();
    Object.assign(apoderado, apoderadoData);
    apoderado.creado_por = creado_por;
    apoderado.actualizado_por = actualizado_por;

    return await dataService.processData(apoderado);
  },

  async actualizarApoderado(
    id: number,
    apoderadoData: any,
    actualizado_por: number
  ) {
    const { error: validationError } = ApoderadoSchema.validate(apoderadoData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const { data: personaData, error: personaError } = await client
      .from("personas")
      .select("*")
      .eq("persona_id", apoderadoData.persona_id)
      .single();
    if (personaError || !personaData) {
      throw new Error("La persona no existe");
    }
    const { data: colegioData, error: colegioError } = await client
      .from("colegios")
      .select("*")
      .eq("colegio_id", apoderadoData.colegio_id)
      .single();
    if (colegioError || !colegioData) {
      throw new Error("El colegio no existe");
    }

    const apoderado: Apoderado = new Apoderado();
    Object.assign(apoderado, apoderadoData);
    apoderado.actualizado_por = actualizado_por;

    await dataService.updateById(id, apoderado);
    return apoderado;
  },

  async responderPreguntas(apoderadoRespuestaData: any) {
    const { alumno_id, apoderado_id, pregunta_id, respuesta_posible_id } =
      apoderadoRespuestaData;
    if (!alumno_id || !pregunta_id || !respuesta_posible_id || !apoderado_id) {
      throw new Error("Faltan datos obligatorios.");
    }
    const { error } = await client
      .from("apoderados_respuestas")
      .update({ respuesta_posible_id: respuesta_posible_id })
      .match({ alumno_id, pregunta_id, apoderado_id });
    if (error) {
      throw new Error(error.message);
    }
    return { message: "Respuesta actualizada correctamente." };
  },

  async eliminarApoderado(id: number) {
    await dataService.deleteById(id);
    return { message: "Apoderado eliminada correctamente" };
  },

  async obtenerPerfilUsuario(SupabaseClient: SupabaseClient, userId: string) {
    const { data: usuario_data, error: error_usuario } = await SupabaseClient
      .from("usuarios")
      .select(
        `
          *,
            idiomas(nombre,idioma_id),
            
            personas(
               apoderados(*, colegios(nombre,colegio_id)),
                persona_id,
                tipo_documento,
                numero_documento,
                nombres,
                apellidos,
                genero_id,
                estado_civil_id,
                fecha_nacimiento
            ),
            
            roles(
                rol_id,
                nombre,
                descripcion,
                funcionalidades_roles(
                    *,
                    funcionalidad_rol_id,
                    funcionalidades(
                        *,
                        funcionalidad_id
                    )
                )
            )
        `
      )
      .eq("usuario_id", userId)
      .single();

    if (error_usuario) {
      throw new Error(error_usuario.message);
    }
    

    const data = mapearDatosAlumno(usuario_data);
    return {
      usuario: data.usuario,
      persona: data.persona,
      rol: data.rol,
      apoderados:usuario_data.personas.apoderados[0] ?? null,
      colegio:usuario_data.personas.apoderados?.[0]?.colegios  ?? null,
    };
  },
};
