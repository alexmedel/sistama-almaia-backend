import { SupabaseClient } from "@supabase/supabase-js";
import { FuncionalidadRolSchema } from "../../sheman/FuncionalidadRolSchema";
 

export async function actualizarFuncionalidadRolService(
  client: SupabaseClient,
  id: number,
  data: any,
  actualizadoPor: number
) {
  // 1. Validar el esquema de los datos de entrada
  const { error: validationError, value: funcionalidadRolData } =
    FuncionalidadRolSchema.validate(data);

  if (validationError) {
    throw new Error(validationError.details[0].message);
  }

  // 2. Validar que el rol y la funcionalidad existan
  const { error: errorRoles } = await client
    .from("roles")
    .select("rol_id")
    .eq("rol_id", funcionalidadRolData.rol_id)
    .single();

  if (errorRoles) {
    throw new Error("El rol no existe");
  }

  const { error: errorFuncionalidades } = await client
    .from("funcionalidades")
    .select("funcionalidad_id")
    .eq("funcionalidad_id", funcionalidadRolData.funcionalidad_id)
    .single();

  if (errorFuncionalidades) {
    throw new Error("La funcionalidad no existe");
  }

  // 3. Preparar el objeto para la actualización
  const dataToUpdate = {
    ...funcionalidadRolData,
    actualizado_por: actualizadoPor,
  };

  // 4. Devolver los datos para que el controlador los actualice
  return dataToUpdate;
}