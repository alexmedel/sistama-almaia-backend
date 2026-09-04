import { Request, Response } from "express";
import { Rol } from "../../../core/modelo/auth/Rol";
import { DataService } from "../DataService";
 
import { RolSchema } from "./sheman/RolSchema";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";

const dataService: DataService<Rol> = new DataService("roles","rol_id");
export const RolesService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const rol = await dataService.getAll(["*"], where);
      return FormatResponse(res, 200, rol);
    } catch (error) {
      errorHandler.handleError(error, res, "RolesService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const rol: Rol = new Rol();
      Object.assign(rol, req.body);
      rol.creado_por = req.creado_por;
      rol.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = RolSchema.validate(req.body);
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedrol = await dataService.processData(rol);
        return FormatResponse(res, 201, savedrol);
        
      }
    } catch (error) {
      errorHandler.handleError(error, res, "RolesService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const rol: Rol = new Rol();
      Object.assign(rol, req.body);
      rol.creado_por = req.creado_por;
      rol.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = RolSchema.validate(req.body);
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, rol);
        return FormatResponse(res, 200, { message: "rol actualizada correctamente" });
      }
    } catch (error) {
      errorHandler.handleError(error, res, "RolesService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, { message: "rol eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "RolesService.eliminar");
    }
  },
};
