import { SupabaseClient } from "@supabase/supabase-js";
import { AuthErrorType, ValidateLoginType } from "../types/interfacesAuth";

export const validateLoginInput = (body: ValidateLoginType) => {
  const { isEmail, identifier, password } = body;
  if (typeof isEmail !== "boolean") {
    throw new Error(
      "Debe especificar si el identificador es un email o un RUN usando 'isEmail'"
    );
  }
  if (!identifier || !password) {
    throw new Error("El identificador y la contraseña son obligatorios");
  }
  return { isEmail, identifier, password };
};

// Método auxiliar: Buscar usuario por RUN
export const findUserByRun = async (run: string, client: SupabaseClient) => {
  console.log("Buscando persona con RUN:", run);

  // Paso 1: Buscar el persona_id en la tabla personas
  const { data: personasData, error: personasError } = await client
    .from("personas")
    .select("persona_id, numero_documento, nombres, activo")
    .eq("numero_documento", run)
    .eq("activo", true) // Filtrar solo personas activas
    .single();

  console.log("Resultado de la consulta a personas:", personasData);

  if (personasError || !personasData) {
    throw new Error(
      "No se encontró una persona activa con el RUN proporcionado"
    );
  }

  // Extraer el persona_id
  const personaId = personasData.persona_id;

  // Paso 2: Buscar el usuario en la tabla usuarios usando el persona_id
  const { data: userData, error: userError } = await client
    .from("usuarios")
    .select("usuario_id, persona_id, email, activo")
    .eq("persona_id", personaId)
    .eq("activo", true) // Filtrar solo usuarios activos
    .order("fecha_creacion", { ascending: false }) // Ordenar por fecha_creacion descendente
    .limit(1) // Tomar solo el último registro
    .single();

  console.log("Resultado de la consulta a usuarios:", userData);

  if (userError || !userData) {
    throw new Error(
      "No se encontró un usuario activo con el RUN proporcionado"
    );
  }

  return userData;
};

export function limpiarEmail(email: string): string {
  if (!email) {
    return "";
  }
  // Se normalizan los caracteres unicode y se eliminan los caracteres invisibles
  return email
    .normalize("NFD") // Descompone caracteres acentuados.
    .replace(/[\u0300-\u036f]/g, "") // Elimina los caracteres diacríticos.
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Elimina los espacios de ancho cero.
    .toLowerCase() // Convierte a minúsculas.
    .trim(); // Elimina espacios al inicio y al final.
}

export const isEmailVerification = (identifier: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const result = emailRegex.test(identifier);
  console.log("Verificando si es email:", identifier, "Resultado:", result);
  return result;
};

export const authErrorHandler = (
  type: string,
  email: string,
  req: any,
  userId: number
): AuthErrorType => {
  if (type === "email") {
    return {
      isSend: false,
      tipo_auditoria_id: 3,
      colegio_id: 0,
      usuario_id: userId,
      descripcion: `Inicio de sesión exitoso para el usuario ${email}`,
      fecha: new Date().toISOString(),
      modulo_afectado: "auth",
      accion_realizada: "login",
      ip_origen: req.ip,
      referencia_id: 2, // Puedes ajustar esto según tu lógica
      model: "Usuarios",
    };
  }
  return {
    isSend: false,
    tipo_auditoria_id: 1,
    colegio_id: 0,
    usuario_id: 0,
    fecha: new Date().toISOString(),
    descripcion: `Error de inicio de sesión para el usuario ${email}`,
    modulo_afectado: "auth",
    accion_realizada: "login",
    ip_origen: req.ip,
    referencia_id: 0, // Puedes ajustar esto según tu lógica
    model: "Usuarios",
  };
};
