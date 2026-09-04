import { Request, Response } from "express";
import { DataService } from "../DataService";
import Joi from "joi";
import { FuncionalidadRol } from "../../../core/modelo/auth/FuncionalidadRol";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import { FuncionalidadRolSchema } from "./sheman/FuncionalidadRolSchema";
import { funcionalidadRols_query } from "./querys/funcionalidadRolQuerys";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { guardarFuncionalidadRolService } from "./funciones/funcionalidadRolFunction/guardarFunctions";
import { actualizarFuncionalidadRolService } from "./funciones/funcionalidadRolFunction/actulizarFunctions";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<FuncionalidadRol> = new DataService(
  "funcionalidades_roles"
);

export const FuncionalidadRolService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const FuncionalidadRol = await dataService.getAll(
        funcionalidadRols_query,
        where
      );
      return FormatResponse(res, STATUS_CODES.OK, FuncionalidadRol);
    } catch (error) {
      errorHandler.handleError(error, res, "FuncionalidadRolService.obtener");
    }
  },
  async guardar(req: Request, res: Response) {
    try {
      // 1. Llamar al servicio de negocio para validar y procesar los datos
      const dataToSave = await guardarFuncionalidadRolService(
        req.supabase,
        req.body
      );

      // 2. Asignar metadatos de creación/actualización
      Object.assign(dataToSave, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });

      // 3. Insertar el registro en la base de datos
      const savedFuncionalidadRol = await dataService.processData(dataToSave);
      // 4. Enviar la respuesta de éxito
      return FormatResponse(res, STATUS_CODES.OK, savedFuncionalidadRol);
    } catch (error: any) {
      errorHandler.handleError(
        error,
        res,
        "FuncionalidadRolController.guardar"
      );
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      // 1. Llamar al servicio de negocio para validar y obtener los datos a actualizar
      const dataToUpdate = await actualizarFuncionalidadRolService(
        req.supabase,
        id,
        req.body,
        req.actualizado_por
      );

      // 2. Actualizar el registro en la base de datos
      await dataService.updateById(id, dataToUpdate);

      return FormatResponse(res, STATUS_CODES.OK, {
        message: "FuncionalidadRol actualizada correctamente",
      });
    } catch (error: any) {
      errorHandler.handleError(
        error,
        res,
        "FuncionalidadRolController.actualizar"
      );
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "FuncionalidadRol eliminada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "FuncionalidadRolService.eliminar");
    }
  },
};
