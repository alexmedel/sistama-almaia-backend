import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import Joi from "joi";
import { UsuarioColegio } from "../../../core/modelo/colegio/UsuarioColegio";
import { mapearColegios } from "../../../core/services/ColegioServiceCasoUso";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { DataService } from "../DataService";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const UsuarioColegioSchema = Joi.object({
  fecha_asignacion: Joi.date().required(),
  colegio_id: Joi.number().integer().required(),
  usuario_id: Joi.number().integer().required(),
  rol_id: Joi.number().integer().required(),
});
const dataService: DataService<UsuarioColegio> = new DataService(
  "usuarios_colegios"
);
export const UsuarioColegiosService = {
  async obtener(req: Request, res: Response) {
    try {
      dataService.setClient(client);

      const userRole = req.user?.rol_id;
      const isGlobalAdmin = userRole === 10 || userRole === 11 || userRole === 12 || userRole === 13;

      let usuariocolegios;
      if (isGlobalAdmin) {
        const { data: activeColegios, error: errCol } = await client
          .from("colegios")
          .select("*")
          .eq("activo", true);

        if (errCol) throw errCol;

        usuariocolegios = (activeColegios || []).map((col) => ({
          colegio_id: col.colegio_id,
          activo: col.activo,
          creado_por: col.creado_por,
          actualizado_por: col.actualizado_por,
          fecha_creacion: col.fecha_creacion,
          fecha_actualizacion: col.fecha_actualizacion,
          colegios: col,
          usuarios: null,
          roles: null,
        }));
      } else {
        usuariocolegios = await dataService.getAll(
          [
            "*",
            "colegios(colegio_id,nombre,nombre_fantasia,dependencia,sitio_web,direccion,telefono_contacto,correo_electronico,comuna_id,region_id,pais_id,creado_por,actualizado_por,fecha_creacion,fecha_actualizacion,activo)",
            "usuarios(usuario_id,nombre_social)",
            "roles(rol_id,nombre)",
          ],
          { ...req.query, "colegios.activo": true, "activo":true}
        );
      }

      const colegios_maping = await mapearColegios(usuariocolegios, client);
      res.status(200).json(colegios_maping);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const usuariocolegio = new UsuarioColegio();
      Object.assign(usuariocolegio, req.body);
      usuariocolegio.creado_por = req.creado_por;
      usuariocolegio.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = UsuarioColegioSchema.validate(
        req.body
      );
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", usuariocolegio.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      const { data: dataUsuario, error: errorUsuario } = await client
        .from("usuarios")
        .select("*")
        .eq("usuario_id", usuariocolegio.usuario_id)
        .single();
      if (errorUsuario || !dataUsuario) {
        throw new Error("El Usuario no existe");
      }
      const { data: dataRol, error: errorRol } = await client
        .from("roles")
        .select("*")
        .eq("rol_id", usuariocolegio.rol_id)
        .single();
      if (errorRol || !dataRol) {
        throw new Error("El rol no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const usuariocolegioCreado = await dataService.processData(
          usuariocolegio
        );
        res.status(201).json(usuariocolegioCreado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const usuariocolegioId = parseInt(req.params.id);

      const usuariocolegio = new UsuarioColegio();
      Object.assign(usuariocolegio, req.body);
      usuariocolegio.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = UsuarioColegioSchema.validate(
        req.body
      );
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", usuariocolegio.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      const { data: dataUsuario, error: errorUsuario } = await client
        .from("usuarios")
        .select("*")
        .eq("usuario_id", usuariocolegio.usuario_id)
        .single();
      if (errorUsuario || !dataUsuario) {
        throw new Error("El Usuario no existe");
      }
      const { data: dataRol, error: errorRol } = await client
        .from("roles")
        .select("*")
        .eq("rol_id", usuariocolegio.rol_id)
        .single();
      if (errorRol || !dataRol) {
        throw new Error("El rol no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const resultado = await dataService.updateById(
          usuariocolegioId,
          usuariocolegio
        );
        res.status(200).json(resultado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const usuariocolegioId = parseInt(req.params.id);
      await dataService.deleteById(usuariocolegioId);
      res.status(200).json({ message: "UsuarioColegio eliminado" });
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
