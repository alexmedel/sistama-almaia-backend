 
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { Usuario } from "../../../core/modelo/auth/Usuario";
import { DataService } from "../DataService";
import { Request, Response } from "express";
import { Persona } from "../../../core/modelo/Persona";
import { Alumno } from "../../../core/modelo/alumno/Alumno";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { usuarios_query } from "./querys/usuarios";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { processUserCreation } from "./funciones/UsuarioServiceFunction.ts/guardarFuntion";
import { actualizarUsuarioService } from "./funciones/UsuarioServiceFunction.ts/updateFuntion";
import {
  saveFile,
  saveImage,
  saveSilgleFile,
} from "../../../helpers/upload-supabase";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<Usuario> = new DataService(
  "usuarios",
  "usuario_id"
);
const dataPersonaService: DataService<Persona> = new DataService(
  "personas",
  "persona_id"
);

const dataImageService: DataService<Partial<Alumno>> = new DataService(
  "alumnos",
  "persona_id"
);

export const UsuariosService = {
  async obtener(req: Request, res: Response) {
    try {
      dataService.setClient(req.supabase);
      const usuarios = await dataService.getAll(
        [
          "usuario_id, activo",
          "personas(persona_id,nombres,apellidos,fecha_nacimiento)",
        ],
        { rol_id: [5, 6, 7] }
      );
      return FormatResponse(res, STATUS_CODES.OK, usuarios);
    } catch (error) {
      errorHandler.handleError(error, res, "UsuariosService.obtener");
    }
  },
  async obtenerBitacora(req: Request, res: Response) {
    try {
      dataService.setClient(req.supabase);
      const usuarios = await dataService.getAll(usuarios_query, {
        rol_id: [5, 8, 9, 13],
      });
      return FormatResponse(res, STATUS_CODES.OK, usuarios);
    } catch (error) {
      errorHandler.handleError(error, res, "UsuariosService.obtenerBitacora");
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const usuarioData = {
        ...req.body,
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      };

      // Llamar al servicio de negocio para procesar la creación
      const usuarioAInsertar = await processUserCreation(
        req.supabase,
        usuarioData
      );

      // Insertar el usuario en la tabla 'usuarios'
      const usuarioCreado = await dataService.processData(usuarioAInsertar);
      return FormatResponse(res, STATUS_CODES.OK, usuarioCreado);
    } catch (error: any) {
      // Manejo de errores unificado
      if (error.message.includes("Auth")) {
        res.status(400).json({ message: error.message });
      } else {
        errorHandler.handleError(error, res, "AuthService.guardar");
      }
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const usuarioId = parseInt(req.params.id);

      const image = await saveSilgleFile(
        client,
        req,
        "user-profile",
        "url_foto_perfil"
      );
      if (req.file && !image) {
        throw new Error("No se pudo guardar la imagen de perfil");
      }
      const data = req.body;

      const usuarioActualizado = await actualizarUsuarioService(
        client,
        usuarioId,
        data,
        {
          actualizado_por: req.actualizado_por,
          fecha_creacion: req.fecha_creacion,
        },
        image
      );
      const { data: usuarios, error: errorUsuarios } = await client
        .from("usuarios")
        .select("*,personas(persona_id,nombres,apellidos,fecha_nacimiento)")
        .eq("usuario_id", usuarioId)
        .single();
      if (errorUsuarios) {
        throw new Error("Error al actualizar la información de usuario");
      }
      return FormatResponse(res, STATUS_CODES.OK, {
        usuarios: usuarios,
        usuarioActualizado: usuarioActualizado,
        
      });
    } catch (error: any) {
      console.log(error);
      errorHandler.handleError(error, res, "AuthService.actualizar");
    }
  },

  async generar_clave(req: Request, res: Response) {
    try {
      const usuarioId = parseInt(req.params.id);
      const { clave } = req.body;
      if (!clave) {
        throw new Error("La clave es requerida.");
      }
      const { error } = await client
        .from("usuarios")
        .update({ clave_generada: clave })
        .eq("usuario_id", usuarioId);

      if (error) {
        throw new Error(error.message);
      }

      return FormatResponse(res, STATUS_CODES.OK, {
        message: "clave generada",
      });
    } catch (err) {
      errorHandler.handleError(err, res, "UsuariosService.generar_clave");
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const usuarioId = parseInt(req.params.id);
      await dataService.deleteById(usuarioId);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Usuario eliminado",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "UsuariosService.eliminar");
    }
  },
};
