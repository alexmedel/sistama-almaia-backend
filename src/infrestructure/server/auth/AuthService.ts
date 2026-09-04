 
import { createClient, SupabaseClient } from "@supabase/supabase-js"; // Asegúrate de importar esto si no está
import { randomInt } from "crypto";
import { Request, Response } from "express";
import Joi from "joi";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { EmailService } from "../../../core/services/EmailService";
import { SupabaseClientService } from "../../../core/services/supabaseClient";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { AuditoriaesService } from "./AuditoriaService";
import {
  getAlumnoEmailById,
  getAuthIdByEmail,
  updateAuthPassword,
} from "./funciones/AuthServicesFuntion.ts/ActulizarPassworClaveDInamicaFunction";
import { getUsuarioAndSolicitud } from "./funciones/AuthServicesFuntion.ts/getUsuarioAndSolicitud";
import { procesarRegistroMasivo } from "./funciones/AuthServicesFuntion.ts/procesarRegistroMasivo";
import { updateUserPasswordById as updateAuthUserPasswordById } from "./funciones/AuthServicesFuntion.ts/validateCurrentPasswordFuntion";
import {
  authErrorHandler,
  findUserByRun,
  isEmailVerification,
} from "./funciones/funtions";

import { verificarExistencia } from "../../../helpers/user-auth-supabase";

const supabaseService = new SupabaseClientService();

const client: SupabaseClient = supabaseService.getClient();
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const createPasswordResetCode = () => randomInt(100000, 1000000).toString();
const MFA_EXEMPT_ROLE_IDS = new Set([2, 4]);
const MFA_ISSUER = "AlmaIA";
const sanitizePasswordResetRequest = (solicitud: any) => ({
  solicitud_id: solicitud?.solicitud_id,
  user_auth_id: solicitud?.user_auth_id,
  created_at: solicitud?.created_at,
  used_pass: solicitud?.used_pass,
});
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_STATUS_ACTIVE = "activo";
const LOGIN_STATUS_FAILED = "fallido_login";
const LOGIN_STATUS_LOCKED = "bloqueado";

function isHighPrivilegeRole(rolId: number | null | undefined) {
  return !!rolId && !MFA_EXEMPT_ROLE_IDS.has(rolId);
}

function createUserScopedClient(accessToken: string) {
  const supabaseUrl = process.env.SUPABASE_HOST || "";
  const supabaseAnonKey = process.env.SUPABASE_PASSWORD || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan variables de entorno de Supabase para MFA");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function getMfaStateForUser(
  authUserId: string,
  accessToken: string
) {
  const admin = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );
  const scopedClient = createUserScopedClient(accessToken);

  const [{ data: factorsData, error: factorsError }, { data: aalData, error: aalError }] =
    await Promise.all([
      admin.auth.admin.mfa.listFactors({ userId: authUserId }),
      scopedClient.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

  if (factorsError) {
    throw new Error(`Error obteniendo factores MFA: ${factorsError.message}`);
  }

  if (aalError) {
    throw new Error(`Error obteniendo nivel MFA: ${aalError.message}`);
  }

  const verifiedFactors = (factorsData?.factors || []).filter(
    (factor: any) => factor.status === "verified"
  );

  return {
    factors: factorsData?.factors || [],
    hasVerifiedFactor: verifiedFactors.length > 0,
    verifiedFactors,
    currentLevel: aalData?.currentLevel || null,
    nextLevel: aalData?.nextLevel || null,
  };
}

async function getLoginAttemptState(email: string) {
  const { data, error } = await client
    .from("usuarios")
    .select("usuario_id,intentos_inicio_sesion,estado_usuario")
    .eq("email", email)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function registerFailedLoginAttempt(
  email: string,
  currentState?: any
) {
  const user = currentState ?? (await getLoginAttemptState(email));
  if (!user?.usuario_id) {
    return;
  }

  const currentAttempts =
    user.estado_usuario === LOGIN_STATUS_FAILED
      ? user.intentos_inicio_sesion || 0
      : 0;
  const nextAttempts = currentAttempts + 1;

  await client
    .from("usuarios")
    .update({
      intentos_inicio_sesion: nextAttempts,
      estado_usuario:
        nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
          ? LOGIN_STATUS_LOCKED
          : LOGIN_STATUS_FAILED,
      fecha_actualizacion: new Date(),
    })
    .eq("usuario_id", user.usuario_id);
}

export const AuthService = {
  async getUserData(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const { data: userData, error: userError } = await client
      .from("usuarios")
      .select(
        `   
            usuario_rol ( * ),
            persona_id,
            usuario_id,
            nombre_social,
            email,
            rol_id,
            telefono_contacto,
            ultimo_inicio_sesion,
            nombres,
            apellidos,
            biometria_activa,
            intentos_inicio_sesion,
            personas(* , alumnos(   colegios(nombre,colegio_id) , email , url_foto_perfil , alumno_id ) , apoderados(  persona_id , apoderado_id ,colegios(nombre,colegio_id))),
            nacionalidades(id,nombre)
          `
      )
      .eq("email", normalizedEmail)
      .single();

    if (userError) {
      return null;
    }
    // ✅ CÓDIGO CORREGIDO
    const { data: rolData, error: rolError } = await client
      .from("usuario_rol")
      .select("*") // 1. Define las columnas a seleccionar
      .eq("usuario_id", userData.usuario_id); // 2. Aplica la condición de filtrado
    // 3. ¡FIN! La query está lista para ser ejecutada
    console.log(userData.usuario_id);
    if (rolError) {
      return null;
    }

    return {
      ...userData,
      rolData,
    };
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    try {
      const loginAttemptState = await getLoginAttemptState(normalizedEmail);

      if (loginAttemptState?.estado_usuario === LOGIN_STATUS_LOCKED) {
        req.body = authErrorHandler("", normalizedEmail, req, 0);
        await AuditoriaesService.guardar(req, res);

        FormatResponse(res, 401, {
          status: 401,
          message: "Cuenta bloqueada por intentos fallidos",
        });

        return;
      }

      const { data: authData, error: authError } =
        await client.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (authError || !authData.user) {
        await registerFailedLoginAttempt(normalizedEmail, loginAttemptState);
        req.body = authErrorHandler("", normalizedEmail, req, 1);
        await AuditoriaesService.guardar(req, res);

        FormatResponse(res, 401, {
          status: 401,
          message: authError?.message || "Autenticación fallida",
        });

        return;
      }

      const userData = await this.getUserData(normalizedEmail);

      if (!userData) {
        errorHandler.handleError(
          new Error("Usuario no encontrado"),
          res,
          "AuthService.login linea 57"
        );

        return;
      }

      const { error: updateError } = await client
        .from("usuarios")
        .update({
          intentos_inicio_sesion: 0,
          estado_usuario: LOGIN_STATUS_ACTIVE,
          ultimo_inicio_sesion: new Date(),
          fecha_actualizacion: new Date(),
          activo: true,
        })
        .eq("usuario_id", userData.usuario_id);

      req.body = authErrorHandler(
        "email",
        normalizedEmail,
        req,
        userData.usuario_id
      );
      await AuditoriaesService.guardar(req, res);

      if (updateError) {
        console.error("Error al actualizar datos de login:", updateError);
      }

      const requiresMfa = isHighPrivilegeRole(userData.rol_id);
      const mfaState = requiresMfa
        ? await getMfaStateForUser(
            authData.user.id,
            authData.session?.access_token || ""
          )
        : null;

      return FormatResponse(res, STATUS_CODES.OK, {
        token: authData.session?.access_token || "",
        refresh_token: authData.session?.refresh_token || "",
        mfa_required: requiresMfa,
        mfa_enrollment_required:
          requiresMfa && !(mfaState?.hasVerifiedFactor ?? false),
        mfa_verified: mfaState?.currentLevel === "aal2",
        mfa_factors: mfaState?.verifiedFactors?.map((factor: any) => ({
          id: factor.id,
          factor_type: factor.factor_type,
          friendly_name: factor.friendly_name,
          status: factor.status,
        })),
        userData,
      });
    } catch (error) {
      return errorHandler.handleError(error, res, "AuthService.login");
    }
  },

  async loginWithIdentifier(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body;

      const isEmail = isEmailVerification(identifier);
      let email = identifier;

      if (!isEmail) {
        const userData = await findUserByRun(identifier, client);
        email = userData.email;
      } else {
        email = normalizeEmail(identifier);
      }

      req.body = { email, password };

      return await this.login(req, res);
    } catch (error) {
      return errorHandler.handleError(
        error,
        res,
        "AuthService.loginWithIdentifier"
      );
    }
  },

  async register(req: Request, res: Response) {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const registerSch = Joi.object({
      email: Joi.string().email().required(), // O usa email si lo prefieres
      password: Joi.string().min(6).required(),
    });
    if (!email || !password) {
      throw new Error("Email y contraseña son requeridos❌");
    }
    if (password.length < 6) {
      throw new Error("La contraseña deber tener 6 caracteres como minimo❌");
    }

    const { error, value } = registerSch.validate({
      ...req.body,
      email: normalizedEmail,
    });
    if (error) throw new Error(error.message);

    try {
      const { data, error } = await client.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }
      FormatResponse(res, 200, {
        message:
          "Usuario registrado exitosamente. Revisa tu correo para confirmar.",
        user: data.user,
      });
    } catch (err: any) {
      errorHandler.handleError(error, res, "AuthService.register");
    }
  },

  async registerMasivo(req: Request, res: Response) {
    if (!req.file) {
      return errorHandler.handleError(
        new Error("No se subió ningún archivo."),
        res,
        "AuthService.registerMasivo"
      );
    }

    try {
      // 2. Crear cliente de Supabase Admin (debe ser gestionado por el controlador o inyectado).
      const adminClient = createClient(
        process.env.SUPABASE_HOST || "",
        process.env.SUPABASE_PASSWORD_ADMIN || ""
      );

      // 3. Llamar al servicio de negocio para procesar el archivo.
      const resultados = await procesarRegistroMasivo(
        adminClient,
        req.file.buffer
      );

      // 4. Devolver la respuesta al cliente.
      FormatResponse(res, STATUS_CODES.OK, {
        total_registrados: resultados.exitosos.length,
        fallidos: resultados.fallidos,
        success: resultados.exitosos,
      });
    } catch (error: any) {
      // Manejar errores inesperados durante el proceso.
      errorHandler.handleError(error, res, "AuthService.registerMasivo");
    }
  },

  async solicitar_cambio_password(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const normalizedEmail = normalizeEmail(email);

      // 1. Validar el formato del email antes de consultar la base de datos
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Formato de email inválido.");
      }

      const newCode = createPasswordResetCode();

      const admin = createClient(
        process.env.SUPABASE_HOST || "",
        process.env.SUPABASE_PASSWORD_ADMIN || ""
      );

      // 2. Buscar el usuario
      const { data: usuario, error: errorUsuario } = await admin
        .from("view_auth_users")
        .select("id") // Solo necesitamos el ID para el siguiente paso
        .eq("email", normalizedEmail)
        .single();

      if (errorUsuario) throw new Error("Usuario no registrado");

      // ID del usuario
      const userAuthId = usuario.id;

      // 3. Intentar **actualizar** una solicitud existente o **insertar** una nueva.

      // Primero, intentamos actualizar si ya existe una solicitud para este user_auth_id
      const { data: updateData, error: updateError } = await client
        .from("solicitudes_cambio_password")
        .update({
          authorization_pass: newCode, // Nuevo código
          created_at: new Date().toISOString(), // Opcional: actualizar el timestamp
          // Otros campos a actualizar (ej: expira_en, is_used)
        })
        .eq("user_auth_id", userAuthId)
        .select("*")
        .single();

      let solicitud;

      if (updateData) {
        // La solicitud se actualizó correctamente
        solicitud = updateData;
      } else {
        // Si no se actualizó nada (updateData es null o el error indica que no se encontró),
        // y el error no es crítico, insertamos una nueva solicitud.
        // Nota: El manejo de errores de Supabase puede variar, es mejor verificar si se actualizó una fila.

        // Si la actualización falla o no encuentra un registro, se inserta
        const { data: insertData, error: insertError } = await client
          .from("solicitudes_cambio_password")
          .insert({
            user_auth_id: userAuthId,
            authorization_pass: newCode,
          })
          .select("*")
          .single();

        if (insertError) {
          // Manejar un error de inserción
          throw new Error(
            `Error al guardar/actualizar la solicitud: ${insertError.message}`
          );
        }
        solicitud = insertData;
      }

      // Asegurarse de que tenemos un objeto solicitud
      if (!solicitud || !solicitud.authorization_pass) {
        throw new Error("No se pudo obtener el código de autorización.");
      }

      // 4. Enviar el email con el nuevo código
      const smtp = new EmailService().enviarEmailRestorePassword(
        normalizedEmail,
        newCode
      );
      if (!smtp) {
        throw new Error("Error al enviar el correo electrónico.");
      }
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Nueva solicitud de código enviada y código actualizado.",
        data: sanitizePasswordResetRequest(solicitud),
      });
    } catch (error: any) {
      errorHandler.handleError(
        error,
        res,
        "AuthService.solicitar_cambio_password linea 235"
      );
    }
  },

  async RestorePassword(req: Request, res: Response) {
    try {
      // 1. Validar los datos de entrada

      const { email, newPassword, pass } = req.body;
      const normalizedEmail = normalizeEmail(email);

      const cambioContrasena = await getUsuarioAndSolicitud(
        normalizedEmail,
        pass,
        newPassword
      );
      if (cambioContrasena === null) {
        throw new Error(
          "Error al cambiar la contraseña verifique su código o contraseña"
        );
      }

      const { usuarioId, solicitud } = cambioContrasena;
      const { data: usuarioData, error: errorUsuario } = await client
        .from("solicitudes_cambio_password")
        .delete()
        .eq("user_auth_id", usuarioId)
        .eq("authorization_pass", pass);

      if (errorUsuario) {
        throw new Error(errorUsuario.message);
      }
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Contraseña actualizada correctamente",
        data: {
          usuarioId,
          solicitud: sanitizePasswordResetRequest(solicitud),
        },
      });
    } catch (error: any) {
      errorHandler.handleError(
        error,
        res,
        "AuthService.updatePassword_By_ClaveDinamica  "
      );
    }
  },
  async updateUserPasswordById(req: Request, res: Response) {
    const { auth_id, newPassword } = req.body;
    if (!auth_id || !newPassword) {
      return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
        message: "auth_id y newPassword son requeridos",
      });
    }

    const { data: user } = await client
      .from("usuarios")
      .select("*")
      .eq("auth_id", auth_id)
      .single();

    if (!user?.email) {
      return FormatResponse(res, STATUS_CODES.NOT_FOUND, {
        message: "Usuario no encontrado",
      });
    }

    await updateAuthUserPasswordById(auth_id, newPassword);

    const { data: session } = await client.auth.signInWithPassword({
      email: user.email,
      password: newPassword,
    });

    FormatResponse(res, STATUS_CODES.OK, {
      message: "Clave generada",
      data: session,
    });
  },
  async updatePassword(req: Request, res: Response) {
    try {
      const body = req.body;
      console.log(body);
      const { newPassword, currentPassword, email } = body;
      const normalizedEmail = normalizeEmail(email);

      const isPassword = await verificarExistencia(
        client,
        normalizedEmail,
        currentPassword
      );

      if (!isPassword) {
        FormatResponse(res, 200, {
          status: 404,
          message: "contraseña incorrecta",
        });
        return;
      }
      if (body.email === undefined) {
        FormatResponse(res, 200, {
          status: 400,
          message: "no tienes permiso para cambiar la contraseña",
        });
        return;
      }

      if (req.body.newPassword === undefined) {
        FormatResponse(res, 200, {
          status: 400,
          message: " la contraseña es requerida",
        });
        return;
      }
      const auth_id = await getAuthIdByEmail(client, normalizedEmail);
      await updateAuthUserPasswordById(auth_id, newPassword);
      const { data: userdata } = await client
        .from("usuarios")
        .select("*")
        .eq("auth_id", auth_id)
        .single();
      const { data: session } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password: newPassword,
      });

      FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        message: "Contraseña actualizada correctamente",
        userdata,
        token: session.session?.access_token,
      });
    } catch (error: any) {
      errorHandler.handleError(
        error,
        res,
        "AuthService.updatePassword linea 468"
      );
    }
  },

  async updatePassword_By_ClaveDinamica(req: Request, res: Response) {
    try {
      const { newPassword, alumno_id } = req.body;

      const email = await getAlumnoEmailById(client, alumno_id);

      const authId = await getAuthIdByEmail(client, email);

      const data = await updateAuthPassword(authId, newPassword);

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Clave generada",
        data,
      });
    } catch (error: any) {
      // Manejo de errores centralizado
      errorHandler.handleError(
        error,
        res,
        "AuthService.updatePassword_By_ClaveDinamica"
      );
    }
  },

  async guardarExpoPushToken(req: Request, res: Response) {
    const { auth_id, expo_push_token } = req.body;
    if (!auth_id || !expo_push_token) {
      res.status(400).json({ error: "Faltan datos" });
      return;
    }
    try {
      const { error } = await client
        .from("usuarios")
        .update({ expo_push_token })
        .eq("auth_id", auth_id);
      if (error) throw error;
      res.json({ message: "Token guardado correctamente." });
      return;
    } catch (error: any) {
      console.error("Error guardando el token:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
  async mfaStatus(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const authId = req.user?.auth_id;

      if (!token || !authId) {
        throw new Error("Token o usuario inválido para consultar MFA");
      }

      const state = await getMfaStateForUser(authId, token);

      FormatResponse(res, STATUS_CODES.OK, {
        required: isHighPrivilegeRole(req.user?.rol_id),
        verified: state.currentLevel === "aal2",
        current_level: state.currentLevel,
        next_level: state.nextLevel,
        has_verified_factor: state.hasVerifiedFactor,
        factors: state.factors.map((factor: any) => ({
          id: factor.id,
          factor_type: factor.factor_type,
          friendly_name: factor.friendly_name,
          status: factor.status,
        })),
      });
    } catch (error: any) {
      errorHandler.handleError(error, res, "AuthService.mfaStatus");
    }
  },
  async mfaEnroll(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const userClient = createUserScopedClient(token || "");
      const friendlyName = req.body?.friendly_name || "Dispositivo principal";

      const { data, error } = await userClient.auth.mfa.enroll({
        factorType: "totp",
        issuer: MFA_ISSUER,
        friendlyName,
      });

      if (error || !data) {
        throw new Error(error?.message || "No se pudo enrolar MFA");
      }

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Enrolamiento MFA iniciado",
        factor_id: data.id,
        factor_type: data.type,
        friendly_name: data.friendly_name,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
    } catch (error: any) {
      errorHandler.handleError(error, res, "AuthService.mfaEnroll");
    }
  },
  async mfaChallenge(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const { factor_id } = req.body;

      if (!factor_id) {
        throw new Error("factor_id es requerido");
      }

      const userClient = createUserScopedClient(token || "");
      const { data, error } = await userClient.auth.mfa.challenge({
        factorId: factor_id,
      });

      if (error || !data) {
        throw new Error(error?.message || "No se pudo generar challenge MFA");
      }

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Challenge MFA generado",
        challenge_id: data.id,
        factor_type: data.type,
        expires_at: data.expires_at,
      });
    } catch (error: any) {
      errorHandler.handleError(error, res, "AuthService.mfaChallenge");
    }
  },
  async mfaVerify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const { factor_id, challenge_id, code } = req.body;

      if (!factor_id || !code) {
        throw new Error("factor_id y code son requeridos");
      }

      const userClient = createUserScopedClient(token || "");
      const response = challenge_id
        ? await userClient.auth.mfa.verify({
            factorId: factor_id,
            challengeId: challenge_id,
            code,
          })
        : await userClient.auth.mfa.challengeAndVerify({
            factorId: factor_id,
            code,
          });

      if (response.error || !response.data) {
        throw new Error(response.error?.message || "No se pudo verificar MFA");
      }

      FormatResponse(res, STATUS_CODES.OK, {
        message: "MFA verificado correctamente",
        token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        user: response.data.user,
      });
    } catch (error: any) {
      errorHandler.handleError(error, res, "AuthService.mfaVerify");
    }
  },
};
