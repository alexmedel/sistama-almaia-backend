import { Request, Response } from "express";
import { DataService } from "../DataService";
import Joi from "joi";
import { AuditoriaPermiso } from "../../../core/modelo/configuracion/AuditoriaPermiso";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";
const AuditoriaPermisoSchema = Joi.object({
  auditoria_id: Joi.number().integer().required(),
  nombre_permiso: Joi.string().max(50).required(),
});
const dataService: DataService<AuditoriaPermiso> = new DataService(
  "auditorias_permisos",
  "auditoria_permiso_id"
);
export const AuditoriaPermisoesService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query;
      let respuestaEnviada = false;
      if (colegio_id !== undefined) {
        const auditoriapermiso = await obtenerRelacionados({
          tableFilter: "auditorias",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "auditoria_id",
          tableIn: "auditorias_permisos",
          inField: "auditoria_id",
          selectFields: `*,                      
                        auditorias(auditoria_id,fecha,usuario_id,descripcion,modulo_afectado,accion_realizada,ip_origen,referencia_id,model)",`,
        });
        respuestaEnviada = true;
        res.json(auditoriapermiso);
      }
      if (!respuestaEnviada) {
        const auditoriapermiso = await dataService.getAll(
          [
            "*",
            "auditorias(auditoria_id,fecha,usuario_id,descripcion,modulo_afectado,accion_realizada,ip_origen,referencia_id,model)",
          ],
          where
        );
        res.json(auditoriapermiso);
      }
    } catch (error) {
      console.error("Error al obtener la auditoriapermiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const auditoriapermiso: AuditoriaPermiso = new AuditoriaPermiso();
      Object.assign(auditoriapermiso, req.body);
      let responseSent = false;
      const { error: validationError } = AuditoriaPermisoSchema.validate(
        req.body
      );
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedauditoriapermiso = await dataService.processData(
          auditoriapermiso
        );
        res.status(201).json(savedauditoriapermiso);
      }
    } catch (error) {
      console.error("Error al guardar la auditoriapermiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const auditoriapermiso: AuditoriaPermiso = new AuditoriaPermiso();
      Object.assign(auditoriapermiso, req.body);
      let responseSent = false;
      const { error: validationError } = AuditoriaPermisoSchema.validate(
        req.body
      );
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, auditoriapermiso);
        res
          .status(200)
          .json({ message: "auditoriapermiso actualizada correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar la auditoriapermiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "auditoriapermiso eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la auditoriapermiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
